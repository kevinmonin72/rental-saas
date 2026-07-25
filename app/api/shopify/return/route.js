import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabase-admin';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Hardcoded Location IDs
const MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_ORIGIN || '81944215861';
const WINGBOOST_MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_DESTINATION || '90749075787';

async function getInventoryItemIdBySku(sku) {
  const query = `
    query {
      productVariants(first: 1, query: "sku:${sku}") {
        nodes {
          id
          sku
          inventoryItem {
            id
          }
        }
      }
    }
  `;

  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });

  if (!res.ok) return null;
  const data = await res.json();
  const variant = data?.data?.productVariants?.nodes?.[0];
  if (!variant?.inventoryItem?.id) return null;

  const gid = variant.inventoryItem.id;
  const numericId = gid.split('/').pop();
  return { gid, numericId };
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    const { data: booking } = await supabase
      .from('bookings')
      .select('reference, start_date, end_date, rental_type, location, customers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    const isParis = booking?.location === 'paris';
    const DEST_LOC_ID = isParis ? '81123311925' : '81944215861'; // Marseille / Paris (Main stores)
    const ORIGIN_LOC_ID = isParis ? '89986531659' : '90749075787'; // Wingboosts

    const { data: items } = await supabase
      .from('booking_items')
      .select('quantity, equipment(reference)')
      .eq('booking_id', bookingId);

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Aucun article à retourner' }, { status: 400 });
    }

    const resRef = booking?.reference || bookingId.split('-')[0].toUpperCase();
    const clientName = `${booking?.customers?.first_name || ''} ${booking?.customers?.last_name || ''}`.trim() || 'Client';
    const note = `RETOUR matériel loc ${resRef} (${clientName})`;
    const tags = [`retour`, `resa-${resRef.toLowerCase()}`];

    const resolvedItems = [];
    for (const item of items) {
      const sku = item.equipment?.reference;
      if (!sku) continue;

      const inv = await getInventoryItemIdBySku(sku);
      if (inv) resolvedItems.push({ gid: inv.gid, numericId: inv.numericId, quantity: item.quantity || 1 });
    }

    // Try GraphQL transfer object (Wingboost -> Marseille)
    const mutation = `
      mutation {
        inventoryTransferCreate(input: {
          originLocationId: "gid://shopify/Location/${ORIGIN_LOC_ID}",
          destinationLocationId: "gid://shopify/Location/${DEST_LOC_ID}",
          lineItems: ${JSON.stringify(resolvedItems.map(ri => ({ inventoryItemId: ri.gid, quantity: ri.quantity })))},
          note: ${JSON.stringify(note)},
          referenceName: ${JSON.stringify(`RETOUR-${resRef}`)},
          tags: ${JSON.stringify(tags)}
        }) {
          inventoryTransfer { id }
          userErrors { message }
        }
      }
    `;

    const transferRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation })
    });

    const transferData = await transferRes.json();
    const isAccessDenied = transferData?.errors?.some(e => e.message?.includes('write_inventory_transfers'));
    const userErrors = transferData?.data?.inventoryTransferCreate?.userErrors;

    if (isAccessDenied || (userErrors && userErrors.length > 0)) {
      // Fallback direct REST stock adjustments
      for (const ri of resolvedItems) {
        // -Wingboost
        await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-04/inventory_levels/adjust.json`, {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ location_id: ORIGIN_LOC_ID, inventory_item_id: ri.numericId, available_adjustment: -ri.quantity })
        });

        // +Marseille
        await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/2024-04/inventory_levels/adjust.json`, {
          method: 'POST',
          headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
          body: JSON.stringify({ location_id: DEST_LOC_ID, inventory_item_id: ri.numericId, available_adjustment: ri.quantity })
        });
      }
    }

    return NextResponse.json({ success: true, message: "Stock réinjecté à Marseille (+Marseille, -Wingboost) !" });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
