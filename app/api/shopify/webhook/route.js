import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

// Helper: extract rental dates from Shopify order line item properties
function extractDatesFromLineItem(item) {
  let startDate = null;
  let endDate = null;
  
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = String(prop.name).toLowerCase().trim();
      const val = String(prop.value).trim();
      
      // Look for standard keywords: début/debut, fin, start, end, retour, commence
      if (name.includes('début') || name.includes('debut') || name.includes('start') || name.includes('commence') || name.includes('debut_date')) {
        startDate = val;
      }
      if (name.includes('fin') || name.includes('end') || name.includes('retour') || name.includes('fin_date')) {
        endDate = val;
      }
    }
  }
  
  // Fallbacks: default to today and today + 7 days if no properties match
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  return {
    startDate: startDate || todayStr,
    endDate: endDate || nextWeekStr
  };
}

export async function POST(req) {
  try {
    const bodyText = await req.text();
    const data = JSON.parse(bodyText);

    // 1. Shopify Signature Verification
    const shopifySignature = req.headers.get('x-shopify-hmac-sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (webhookSecret && shopifySignature) {
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText, 'utf8')
        .digest('base64');
        
      if (hash !== shopifySignature) {
        console.error("Signature Shopify invalide !");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const topic = req.headers.get('x-shopify-topic') || '';
    console.log(`Webhook Shopify reçu [Topic: ${topic}] :`, data);

    // 2. Route payload processing based on topic or content
    if (topic === 'orders/create' || data.line_items) {
      // CASE A: NEW CLIENT RESERVATION VIA SHOPIFY ORDER CHECKOUT
      const email = data.customer?.email || data.email;
      const firstName = data.customer?.first_name || data.billing_address?.first_name || 'Client';
      const lastName = data.customer?.last_name || data.billing_address?.last_name || 'Shopify';
      const phone = data.customer?.phone || data.billing_address?.phone || null;

      if (!email) {
        console.warn("Pas d'email associé à la commande, abandon de la synchronisation");
        return NextResponse.json({ message: 'No email found, skipped' }, { status: 200 });
      }

      // Check if client already exists in our DB
      let customerId = null;
      const { data: existingCust, error: searchErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (searchErr) throw searchErr;

      if (existingCust) {
        customerId = existingCust.id;
        // Keep phone updated if provided
        if (phone) {
          await supabase.from('customers').update({ phone: phone.trim() }).eq('id', customerId);
        }
      } else {
        customerId = crypto.randomUUID();
        const { error: custErr } = await supabase.from('customers').insert([{
          id: customerId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null
        }]);
        if (custErr) throw custErr;
      }

      // Create bookings for matching line items
      for (const item of data.line_items || []) {
        let equipmentId = null;

        // Step 1: Match by SKU Reference
        if (item.sku) {
          const { data: eq } = await supabase
            .from('equipment')
            .select('id')
            .eq('reference', item.sku)
            .maybeSingle();
          if (eq) {
            equipmentId = eq.id;
          }
        }

        // Step 2: Match by Title keyword check
        if (!equipmentId && item.title) {
          const { data: eq } = await supabase
            .from('equipment')
            .select('id')
            .ilike('name', `%${item.title}%`)
            .limit(1)
            .maybeSingle();
          if (eq) {
            equipmentId = eq.id;
          }
        }

        if (equipmentId) {
          const { startDate, endDate } = extractDatesFromLineItem(item);
          const isWingboost = String(item.title).toLowerCase().includes('wingboost') || 
                              String(item.sku).toLowerCase().includes('wingboost');

          const bookingId = crypto.randomUUID();
          
          // Create main booking row
          const { error: bookErr } = await supabase.from('bookings').insert([{
            id: bookingId,
            customer_id: customerId,
            start_date: startDate,
            end_date: endDate,
            status: 'active',
            shopify_transfer: true, // Tagged as originating from Shopify checkout
            rental_type: isWingboost ? 'wingboost' : 'ponctuel'
          }]);
          if (bookErr) throw bookErr;

          // Create item link row
          const { error: itemsErr } = await supabase.from('booking_items').insert([{
            id: crypto.randomUUID(),
            booking_id: bookingId,
            equipment_id: equipmentId,
            quantity: item.quantity || 1
          }]);
          if (itemsErr) throw itemsErr;
          
          console.log(`Réservation créée avec succès pour ${email} (Équipement ID: ${equipmentId}, dates: ${startDate} à ${endDate})`);
        } else {
          console.log(`Aucun article d'inventaire correspondant pour l'article de commande : "${item.title}" (SKU: ${item.sku})`);
        }
      }

      return NextResponse.json({ message: 'Commande Shopify traitée avec succès en réservations' }, { status: 200 });

    } else {
      // CASE B: QUANTITY ADJUSTMENT SYNC (INVENTORY_LEVELS/UPDATE)
      const { inventory_item_id, available } = data;
      if (!inventory_item_id) {
        return NextResponse.json({ message: 'Payload non reconnu ou ignoré' }, { status: 200 });
      }

      const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || 'theridery.myshopify.com';
      const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

      if (!shopifyToken) {
        console.error("Token Shopify manquant dans les variables d'environnement");
        return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 });
      }

      const shopifyRes = await fetch(`https://${shopifyDomain}/admin/api/2024-01/inventory_items/${inventory_item_id}.json`, {
        headers: {
          'X-Shopify-Access-Token': shopifyToken,
          'Content-Type': 'application/json'
        }
      });

      if (!shopifyRes.ok) {
        console.error("Erreur de récupération du SKU depuis Shopify:", await shopifyRes.text());
        return NextResponse.json({ error: 'Failed to fetch SKU' }, { status: 500 });
      }

      const shopifyItemData = await shopifyRes.json();
      const sku = shopifyItemData.inventory_item?.sku;

      if (!sku) {
        console.log(`Aucun SKU trouvé pour l'inventory_item_id ${inventory_item_id}`);
        return NextResponse.json({ message: 'No SKU found, ignored' }, { status: 200 });
      }

      console.log(`Mise à jour dans Supabase : article ${sku} -> nouvelle quantité : ${available}`);
      const { error: supabaseError } = await supabase
        .from('equipment')
        .update({ quantity: available })
        .eq('reference', sku);
        
      if (supabaseError) {
        console.error("Erreur de mise à jour de l'inventaire Supabase:", supabaseError);
        throw supabaseError;
      }

      return NextResponse.json({ message: 'Stock d\'inventaire mis à jour avec succès' }, { status: 200 });
    }

  } catch (error) {
    console.error("Erreur lors du traitement du webhook Shopify:", error);
    return NextResponse.json({ error: 'Erreur interne', details: error.message }, { status: 500 });
  }
}
