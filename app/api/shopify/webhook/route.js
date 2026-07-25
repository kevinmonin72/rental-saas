import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabase-admin';
import crypto from 'crypto';

// Helper: extract rental dates from Shopify order line item properties
function extractDatesFromLineItem(item) {
  let startDate = null;
  let endDate = null;
  
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = String(prop.name).toLowerCase().trim();
      const val = String(prop.value).trim();
      
      if (name.includes('début') || name.includes('debut') || name.includes('start') || name.includes('commence') || name.includes('debut_date')) {
        startDate = val;
      }
      if (name.includes('fin') || name.includes('end') || name.includes('retour') || name.includes('fin_date')) {
        endDate = val;
      }
    }
  }
  
  return {
    startDate: startDate,
    endDate: endDate
  };
}

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const data = JSON.parse(bodyText);

    // 1. Shopify Signature Verification
    const shopifySignature = req.headers.get('x-shopify-hmac-sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (!webhookSecret || !shopifySignature) {
      console.error("Signature Shopify manquante ou clé secrète non configurée !");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hash = crypto
      .createHmac('sha256', webhookSecret)
      .update(bodyText, 'utf8')
      .digest('base64');
      
    if (hash !== shopifySignature) {
      console.error("[SECURITY] Invalid Shopify Webhook signature in rental-saas!");
      return NextResponse.json({ error: 'Unauthorized: Invalid Signature' }, { status: 401 });
    }

    const topic = req.headers.get('x-shopify-topic') || '';
    console.log(`Webhook Shopify reçu [Topic: ${topic}]`);

    // --- PRODUCTS SYNC ---
    if (topic.startsWith('products/')) {
      if (topic === 'products/delete') {
        console.log("Product deleted on Shopify, Cron will clean it up next run.");
        return NextResponse.json({ message: 'Product delete noted' }, { status: 200 });
      }
      
      const product = data;
      if (product.status !== 'active') {
        console.log("Product is not active, skipping.");
        return NextResponse.json({ message: 'Product inactive' }, { status: 200 });
      }

      const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
      const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
      if (!shopifyToken || !shopifyDomain) {
        return NextResponse.json({ error: 'Shopify config missing' }, { status: 500 });
      }

      const productId = product.admin_graphql_api_id || `gid://shopify/Product/${product.id}`;

      const query = `
      {
        product(id: "${productId}") {
          title
          productType
          featuredImage { url }
          variants(first: 50) {
            edges {
              node {
                title
                sku
                barcode
                image { url }
                inventoryItem {
                  inventoryLevels(first: 10) {
                    edges {
                      node {
                        location { id }
                        quantities(names: ["available"]) { quantity }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`;

      try {
        const res = await fetch(`https://${shopifyDomain}/admin/api/2024-01/graphql.json`, {
          method: 'POST',
          headers: {
            'X-Shopify-Access-Token': shopifyToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query })
        });
        
        const graphData = await res.json();
        if (graphData.errors || !graphData.data.product) {
          console.error("GraphQL error on webhook:", graphData.errors);
          return NextResponse.json({ error: 'GraphQL error' }, { status: 500 });
        }

        const prodNode = graphData.data.product;
        
        for (const { node: variant } of prodNode.variants.edges) {
          const sku = variant.sku || variant.barcode;
          if (!sku) continue;

          let qtyMarseille = 0;
          let qtyParis = 0;
          
          if (variant.inventoryItem?.inventoryLevels?.edges) {
            for (const { node: level } of variant.inventoryItem.inventoryLevels.edges) {
              const locId = level.location?.id;
              const qty = level.quantities?.[0]?.quantity || 0;
              if (locId === 'gid://shopify/Location/90826146123') qtyMarseille = qty;
              if (locId === 'gid://shopify/Location/89633751371') qtyParis = qty;
            }
          }

          const baseItem = {
            reference: sku,
            name: `${prodNode.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.replace(/\s*-\s*\d+\s*jours?\s*$/i, '').trim(),
            category: prodNode.productType || 'Général',
            brand: variant.image?.url || prodNode.featuredImage?.url || null
          };

          const itemsToUpsert = [
            { ...baseItem, quantity: qtyMarseille, location: 'marseille' },
            { ...baseItem, quantity: qtyParis, location: 'paris' }
          ];

          const { data: existingRecords } = await supabase.from('equipment').select('id, location').eq('reference', sku);

          for (const item of itemsToUpsert) {
            const existing = existingRecords?.find(e => e.location === item.location);
            const record = {
              id: existing ? existing.id : crypto.randomUUID(),
              ...item
            };
            await supabase.from('equipment').upsert([record]);
          }
        }
      } catch (err) {
        console.error("Webhook product fetch failed:", err);
      }
      
      return NextResponse.json({ message: 'Product synced with locations' }, { status: 200 });
    }

    // --- CUSTOMERS SYNC ---
    if (topic.startsWith('customers/')) {
      const customer = data;
      const email = customer.email;
      const phone = customer.phone;

      if (topic === 'customers/delete') {
        if (email) {
           await supabase.from('customers').delete().eq('email', email);
        }
        return NextResponse.json({ message: 'Customer deleted' }, { status: 200 });
      }

      // create or update
      let existingCust = null;
      if (email) {
        const { data: c1s } = await supabase
          .from('customers')
          .select('id, address')
          .eq('email', email.trim().toLowerCase())
          .limit(1);
        existingCust = c1s && c1s.length > 0 ? c1s[0] : null;
      }
      if (!existingCust && phone) {
        const { data: c2s } = await supabase
          .from('customers')
          .select('id, address')
          .eq('phone', phone.trim())
          .limit(1);
        existingCust = c2s && c2s.length > 0 ? c2s[0] : null;
      }

      const custData = {
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: email || null,
        phone: phone || null,
        address: customer.default_address ? `${customer.default_address.address1}, ${customer.default_address.city}` : (existingCust?.address || null)
      };

      if (existingCust) {
        await supabase.from('customers').update(custData).eq('id', existingCust.id);
      } else {
        await supabase.from('customers').insert({ id: crypto.randomUUID(), ...custData });
      }
      return NextResponse.json({ message: 'Customer synced' }, { status: 200 });
    }

    // --- ORDERS (RESERVATIONS) SYNC ---
    if (topic === 'orders/create' || topic === 'orders/paid' || data.line_items) {
      // Only create bookings after confirmed payment
      const financialStatus = data.financial_status;
      const isPaid = financialStatus === 'paid' || financialStatus === 'authorized';

      if (topic === 'orders/create' && !isPaid) {
        console.log(`[WEBHOOK] orders/create ignored — payment not confirmed yet (status: ${financialStatus})`);
        return NextResponse.json({ message: 'Waiting for payment confirmation' }, { status: 200 });
      }

      const shopifyOrderId = String(data.id || '');
      const bookingStatus = 'active';
      
      // Anti-doublon : vérifier si cette commande Shopify a déjà été traitée
      if (shopifyOrderId) {
        const { data: existingOrders } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('shopify_order_id', shopifyOrderId);
        
        if (existingOrders && existingOrders.length > 0) {
          // Si la commande est maintenant payée et qu'une réservation était en attente de paiement, on l'active
          const pendingBooking = existingOrders.find(b => b.status === 'attente_paiement');
          if (isPaid && pendingBooking) {
            console.log(`Commande Shopify ${shopifyOrderId} payée. Passage du statut de la réservation à active.`);
            await supabase.from('bookings').update({ status: 'active' }).eq('id', pendingBooking.id);
            
            // Update Promo Code usage if any discount was applied (now that it is paid)
            const codesToUpdate = new Set();
            if (data.discount_codes && Array.isArray(data.discount_codes)) {
              data.discount_codes.forEach(dc => {
                if (dc.code) codesToUpdate.add(dc.code.toUpperCase());
              });
            }
            if (data.discount_applications && Array.isArray(data.discount_applications)) {
              data.discount_applications.forEach(da => {
                if (da.title) codesToUpdate.add(da.title.toUpperCase());
              });
            }

            for (const code of codesToUpdate) {
              const { data: promo } = await supabase.from('promo_codes').select('id, used_count').eq('code', code).maybeSingle();
              if (promo) {
                await supabase.from('promo_codes').update({ used_count: (promo.used_count || 0) + 1 }).eq('id', promo.id);
              }
            }
            return NextResponse.json({ message: 'Order status updated to active and promo code synced' }, { status: 200 });
          }
          
          // Nettoyer les doublons éventuels (garder le premier, supprimer les autres)
          if (existingOrders.length > 1) {
            console.log(`⚠️ Nettoyage de ${existingOrders.length - 1} doublon(s) pour la commande Shopify ${shopifyOrderId}`);
            const [keep, ...duplicates] = existingOrders;
            for (const dup of duplicates) {
              await supabase.from('booking_items').delete().eq('booking_id', dup.id);
              await supabase.from('bookings').delete().eq('id', dup.id);
            }
          }
          
          console.log(`⚠️ Commande Shopify ${shopifyOrderId} déjà importée (status: ${existingOrders[0].status}), ignorée.`);
          return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
        }
      }

      const email = data.customer?.email || data.email;
      const firstName = data.customer?.first_name || data.billing_address?.first_name || 'Client';
      const lastName = data.customer?.last_name || data.billing_address?.last_name || 'Shopify';
      const phone = data.customer?.phone || data.billing_address?.phone || null;

      if (!email) {
        return NextResponse.json({ message: 'No email found, skipped' }, { status: 200 });
      }

      let customerId = null;
      const { data: existingCusts } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .limit(1);
      
      const existingCust = existingCusts && existingCusts.length > 0 ? existingCusts[0] : null;

      if (existingCust) {
        customerId = existingCust.id;
        const updateData = {
          first_name: firstName.trim(),
          last_name: lastName.trim()
        };
        if (phone) {
          updateData.phone = phone.trim();
        }
        await supabase.from('customers').update(updateData).eq('id', customerId);
      } else {
        customerId = crypto.randomUUID();
        await supabase.from('customers').insert([{
          id: customerId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone ? phone.trim() : null
        }]);
      }

      // Collecter tous les items de location de la commande
      let rentalItems = [];
      let globalStartDate = null;
      let globalEndDate = null;

      for (const item of data.line_items || []) {
        let equipmentId = null;
        if (item.sku) {
          const { data: eq } = await supabase.from('equipment').select('id').eq('reference', item.sku).maybeSingle();
          if (eq) equipmentId = eq.id;
        }
        if (!equipmentId && item.title) {
          const { data: eq } = await supabase.from('equipment').select('id').ilike('name', `%${item.title}%`).limit(1).maybeSingle();
          if (eq) equipmentId = eq.id;
        }

        if (equipmentId) {
          const { startDate, endDate } = extractDatesFromLineItem(item);
          const isWingboost = String(item.title).toLowerCase().includes('wingboost') || String(item.sku).toLowerCase().includes('wingboost');
          
          // Wingboost = achat produit, pas une location → on skip
          if (isWingboost) {
            console.log(`Skipping wingboost product (not a rental): ${item.title}`);
            continue;
          }

          if (!startDate || !endDate) {
            console.log(`ping non-rental item: ${item.title}`);
            continue;
          }
          
          // Utiliser les premières dates trouvées comme dates globales de la réservation
          if (!globalStartDate && startDate) globalStartDate = startDate;
          if (!globalEndDate && endDate) globalEndDate = endDate;

          rentalItems.push({
            equipment_id: equipmentId,
            quantity: item.quantity || 1
          });
        }
      }

      let bookingCreated = false;

      if (rentalItems.length > 0) {
        // Créer UNE SEULE réservation pour toute la commande
        const bookingId = crypto.randomUUID();
        
        const { error: bookingErr } = await supabase.from('bookings').insert([{
          id: bookingId,
          customer_id: customerId,
          start_date: globalStartDate || new Date().toISOString().split('T')[0],
          end_date: globalEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: bookingStatus,
          shopify_transfer: true,
          rental_type: 'ponctuel',
          shopify_order_id: shopifyOrderId || null
        }]);

        if (bookingErr) {
          console.error('[WEBHOOK] Failed to insert booking:', bookingErr.message);
          return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
        }

        // Insérer tous les items liés à cette unique réservation
        for (const ri of rentalItems) {
          const { error: itemErr } = await supabase.from('booking_items').insert([{
            id: crypto.randomUUID(),
            booking_id: bookingId,
            equipment_id: ri.equipment_id,
            quantity: ri.quantity
          }]);
          if (itemErr) {
            console.error('[WEBHOOK] Failed to insert booking_item:', itemErr.message);
          }
        }

        bookingCreated = true;

        // Post-insert dedup check : si un autre webhook concurrent a aussi inséré,
        // on supprime les doublons en ne gardant que le plus ancien
        if (shopifyOrderId) {
          const { data: allForOrder } = await supabase
            .from('bookings')
            .select('id, created_at')
            .eq('shopify_order_id', shopifyOrderId)
            .order('created_at', { ascending: true });
          
          if (allForOrder && allForOrder.length > 1) {
            console.log(`[DEDUP] Race condition detected for order ${shopifyOrderId}: ${allForOrder.length} bookings. Cleaning...`);
            const [keep, ...extras] = allForOrder;
            for (const extra of extras) {
              await supabase.from('booking_items').delete().eq('booking_id', extra.id);
              await supabase.from('bookings').delete().eq('id', extra.id);
            }
            console.log(`[DEDUP] Kept booking ${keep.id}, removed ${extras.length} duplicate(s).`);
          }
        }
      }

      // Move fulfillment order to Marseille location
      if (bookingCreated && shopifyOrderId) {
        const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
        const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
        if (shopifyToken && shopifyDomain) {
          try {
            const foRes = await fetch(`https://${shopifyDomain}/admin/api/2024-01/orders/${shopifyOrderId}/fulfillment_orders.json`, {
              headers: { 'X-Shopify-Access-Token': shopifyToken }
            });
            if (foRes.ok) {
              const foData = await foRes.json();
              for (const fo of (foData.fulfillment_orders || [])) {
                await fetch(`https://${shopifyDomain}/admin/api/2024-01/fulfillment_orders/${fo.id}/move.json`, {
                  method: 'POST',
                  headers: { 'X-Shopify-Access-Token': shopifyToken, 'Content-Type': 'application/json' },
                  body: JSON.stringify({ fulfillment_order: { new_location_id: '81944215861' } })
                });
              }
            }
          } catch (e) {
            console.error('[WEBHOOK] Failed to move fulfillment to Marseille:', e.message);
          }
        }
      }

      // Update Promo Code usage if any discount was applied (only if paid)
      if (bookingCreated && isPaid) {
        const codesToUpdate = new Set();
        if (data.discount_codes && Array.isArray(data.discount_codes)) {
          data.discount_codes.forEach(dc => {
            if (dc.code) codesToUpdate.add(dc.code.toUpperCase());
          });
        }
        if (data.discount_applications && Array.isArray(data.discount_applications)) {
          data.discount_applications.forEach(da => {
            if (da.title) codesToUpdate.add(da.title.toUpperCase());
          });
        }

        for (const code of codesToUpdate) {
          const { data: promo } = await supabase.from('promo_codes').select('id, used_count').eq('code', code).maybeSingle();
          if (promo) {
            await supabase.from('promo_codes').update({ used_count: (promo.used_count || 0) + 1 }).eq('id', promo.id);
          }
        }
      }

      return NextResponse.json({ 
        message: bookingCreated 
          ? `Commande Shopify traitée avec succès (statut: ${bookingStatus})` 
          : 'Aucun article de location trouvé dans la commande' 
      }, { status: 200 });
    } 

    // --- INVENTORY SYNC ---
    if (topic === 'inventory_levels/update' || data.inventory_item_id) {
      const { inventory_item_id, available } = data;
      if (!inventory_item_id) return NextResponse.json({ message: 'Ignored' }, { status: 200 });

      const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN;
      const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
      if (!shopifyToken) return NextResponse.json({ error: 'Config missing' }, { status: 500 });

      const shopifyRes = await fetch(`https://${shopifyDomain}/admin/api/2024-01/inventory_items/${inventory_item_id}.json`, {
        headers: { 'X-Shopify-Access-Token': shopifyToken, 'Content-Type': 'application/json' }
      });

      if (!shopifyRes.ok) return NextResponse.json({ error: 'Failed to fetch SKU' }, { status: 500 });

      const shopifyItemData = await shopifyRes.json();
      const sku = shopifyItemData.inventory_item?.sku;

      if (sku) {
        await supabase.from('equipment').update({ quantity: available }).eq('reference', sku);
      }
      return NextResponse.json({ message: 'Stock mis à jour' }, { status: 200 });
    }

    return NextResponse.json({ message: 'Unhandled topic' }, { status: 200 });

  } catch (error) {
    console.error("Erreur webhook Shopify:", error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
