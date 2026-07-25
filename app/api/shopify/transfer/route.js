import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabase-admin';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

const MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_ORIGIN || '81944215861';
const WINGBOOST_MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_DESTINATION || '90749075787';

async function getVariantBySku(sku) {
  const query = `
    query {
      productVariants(first: 1, query: "sku:${sku}") {
        nodes {
          id
          sku
          inventoryItem { id }
        }
      }
    }
  `;
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  if (!res.ok) return null;
  const data = await res.json();
  const node = data?.data?.productVariants?.nodes?.[0];
  if (!node) return null;
  return {
    inventoryGid: node.inventoryItem?.id,
    inventoryId: node.inventoryItem?.id?.split('/').pop(),
    quantity: 1,
    sku,
  };
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'ID de réservation manquant' }, { status: 400 });
    if (!SHOPIFY_TOKEN) return NextResponse.json({ error: 'Token Shopify manquant' }, { status: 500 });

    const { data: booking, error: bookErr } = await supabase
      .from('bookings')
      .select('id, reference, start_date, end_date, rental_type, location, customers (first_name, last_name, email)')
      .eq('id', bookingId)
      .single();
    if (bookErr || !booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });

    const isParis = booking.location === 'paris';
    const ORIGIN_LOC_ID = isParis ? '81123311925' : '81944215861'; // Paris : Marseille
    const DEST_LOC_ID = isParis ? '89986531659' : '90749075787'; // Leasing & Wingboost : Wingboost Marseille

    const { data: items, error: itemsErr } = await supabase
      .from('booking_items')
      .select('quantity, equipment (reference, name)')
      .eq('booking_id', bookingId);
    if (itemsErr || !items?.length) return NextResponse.json({ error: 'Aucun équipement trouvé' }, { status: 400 });

    const clientName = `${booking.customers?.first_name || ''} ${booking.customers?.last_name || ''}`.trim() || 'Client';
    const resRef = booking.reference || booking.id.split('-')[0].toUpperCase();
    const note = `Location ${booking.rental_type || 'Wingboost'} ${booking.start_date}→${booking.end_date} — ${clientName} (${booking.customers?.email || ''})`;

    // Resolve SKUs
    const resolved = [];
    for (const item of items) {
      const sku = item.equipment?.reference;
      if (!sku) continue;
      const v = await getVariantBySku(sku);
      if (v) resolved.push({ ...v, quantity: item.quantity || 1 });
    }
    if (!resolved.length) return NextResponse.json({ error: 'SKU Shopify introuvables pour cet équipement' }, { status: 400 });

    // Fallback: inventoryMoveQuantities
    const moveChanges = resolved.map(r =>
      `{ inventoryItemId: "${r.inventoryGid}", fromLocationId: "gid://shopify/Location/${ORIGIN_LOC_ID}", toLocationId: "gid://shopify/Location/${DEST_LOC_ID}", delta: ${r.quantity} }`
    ).join(', ');

    // 1st try: inventoryTransferCreateAsReadyToShip
    const lineItemsGql = resolved.map(r => `{ inventoryItemId: "${r.inventoryGid}", quantity: ${r.quantity} }`).join(', ');
    const mutation = `
      mutation {
        inventoryTransferCreateAsReadyToShip(input: {
          originLocationId: "gid://shopify/Location/${ORIGIN_LOC_ID}",
          destinationLocationId: "gid://shopify/Location/${DEST_LOC_ID}",
          lineItems: [${lineItemsGql}],
          note: ${JSON.stringify(note)},
          referenceName: ${JSON.stringify(`RESA-${resRef}`)}
        }) {
          inventoryTransfer {
            id
            name
          }
          userErrors { field message }
        }
      }
    `;

    const gqlRes = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: mutation })
    });
    const gqlData = await gqlRes.json();
    const transfer = gqlData?.data?.inventoryTransferCreateAsReadyToShip?.inventoryTransfer;
    const userErrors = gqlData?.data?.inventoryTransferCreateAsReadyToShip?.userErrors || [];
    const gqlTopErrors = gqlData?.errors || [];

    if (transfer?.id && !userErrors.length) {
      await supabase.from('bookings').update({ shopify_transfer: true }).eq('id', bookingId);
      return NextResponse.json({ success: true, mode: 'transfer', message: `Transfert créé et prêt à expédier : ${transfer.name || transfer.id}` });
    }

    const errDetail = gqlTopErrors.length
      ? gqlTopErrors.map(e => e.message).join('; ')
      : userErrors.map(e => e.message).join('; ');

    return NextResponse.json({
      error: `Échec transfert: ${errDetail}`
    }, { status: 500 });

  } catch (err) {
    console.error('Erreur API Shopify Transfer:', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur interne' }, { status: 500 });
  }
}
