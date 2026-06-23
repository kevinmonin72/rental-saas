import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
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
        // Delete all variants associated with this product id
        // Shopify only gives { id: 12345 } for delete
        // We can't delete by SKU if we only have product ID, unless we stored shopify_product_id.
        // For now, since we only store SKUs, we can't easily delete by product ID from webhook unless we query shopify or we just let cron handle deletions.
        console.log("Product deleted on Shopify, Cron will clean it up next run.");
        return NextResponse.json({ message: 'Product delete noted' }, { status: 200 });
      }
      
      // For create/update
      const product = data;
      if (product.status !== 'active') {
        console.log("Product is not active, skipping.");
        return NextResponse.json({ message: 'Product inactive' }, { status: 200 });
      }

      for (const variant of product.variants || []) {
        if (!variant.sku) continue;

        const eqData = {
          reference: variant.sku,
          name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
          category: product.product_type || 'Général',
          quantity: variant.inventory_quantity || 0,
        };

        const { data: existing } = await supabase.from('equipment').select('id').eq('reference', variant.sku).maybeSingle();
        if (existing) {
          await supabase.from('equipment').update(eqData).eq('id', existing.id);
        } else {
          await supabase.from('equipment').insert({ id: crypto.randomUUID(), ...eqData });
        }
      }
      return NextResponse.json({ message: 'Product synced' }, { status: 200 });
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
        const { data: c1 } = await supabase.from('customers').select('id, address').eq('email', email).maybeSingle();
        existingCust = c1;
      }
      if (!existingCust && phone) {
        const { data: c2 } = await supabase.from('customers').select('id, address').eq('phone', phone).maybeSingle();
        existingCust = c2;
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
    if (topic === 'orders/create' || data.line_items) {
      const shopifyOrderId = String(data.id || '');
      
      // Anti-doublon : vérifier si cette commande Shopify a déjà été traitée
      if (shopifyOrderId) {
        const { data: existingOrder } = await supabase
          .from('bookings')
          .select('id')
          .eq('shopify_order_id', shopifyOrderId)
          .limit(1)
          .maybeSingle();
        
        if (existingOrder) {
          console.log(`⚠️ Commande Shopify ${shopifyOrderId} déjà importée, ignorée.`);
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
      const { data: existingCust } = await supabase.from('customers').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();

      if (existingCust) {
        customerId = existingCust.id;
        if (phone) await supabase.from('customers').update({ phone: phone.trim() }).eq('id', customerId);
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
          
          if (!isWingboost && (!startDate || !endDate)) {
            console.log(`Skipping non-rental item: ${item.title}`);
            continue;
          }
          
          const bookingId = crypto.randomUUID();
          
          await supabase.from('bookings').insert([{
            id: bookingId,
            customer_id: customerId,
            start_date: startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
            shopify_transfer: true,
            rental_type: isWingboost ? 'wingboost' : 'ponctuel',
            shopify_order_id: shopifyOrderId || null
          }]);

          await supabase.from('booking_items').insert([{
            id: crypto.randomUUID(),
            booking_id: bookingId,
            equipment_id: equipmentId,
            quantity: item.quantity || 1
          }]);
        }
      }
      // 4. Update Promo Code usage if any discount was applied
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

      return NextResponse.json({ message: 'Commande Shopify traitée avec succès en réservations' }, { status: 200 });
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
