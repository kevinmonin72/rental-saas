import { NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '../../../../lib/supabase-admin';

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-10';

const MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_ORIGIN || '81944215861';
const WINGBOOST_MARSEILLE_LOC_ID = process.env.SHOPIFY_LOC_DESTINATION || '90749075787';

async function getInventoryItemIdBySku(sku) {
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
  return node.inventoryItem?.id;
}

async function transferAndReceive(originId, destinationId, itemsGroup, note, referenceName) {
  const lineItemsGql = itemsGroup.map(r => `{ inventoryItemId: "${r.gid}", quantity: 1 }`).join(', ');
  const mutation = `
    mutation {
      inventoryTransferCreateAsReadyToShip(input: {
        originLocationId: "gid://shopify/Location/${originId}",
        destinationLocationId: "gid://shopify/Location/${destinationId}",
        lineItems: [${lineItemsGql}],
        note: ${JSON.stringify(note)},
        referenceName: ${JSON.stringify(referenceName)}
      }) {
        inventoryTransfer { id name }
        userErrors { field message }
      }
    }
  `;

  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: mutation })
  });
  const data = await res.json();
  const transfer = data?.data?.inventoryTransferCreateAsReadyToShip?.inventoryTransfer;
  const userErrors = data?.data?.inventoryTransferCreateAsReadyToShip?.userErrors || [];

  if (transfer?.id) {
    return { success: true, name: transfer.name };
  }
  return { success: false, errors: userErrors.map(e => e.message) };
}

export async function POST(req) {
  try {
    const { bookingId, addedSkus = [], returnedSkus = [] } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'ID manquant' }, { status: 400 });

    if (addedSkus.length === 0 && returnedSkus.length === 0) {
      return NextResponse.json({ success: true, message: 'Rien à synchroniser' });
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('reference, location, customers(first_name, last_name)')
      .eq('id', bookingId)
      .single();

    const isParis = booking?.location === 'paris';
    const MAIN_STORE_LOC_ID = isParis ? '81123311925' : '81944215861'; // Paris : Marseille
    const WINGBOOST_LOC_ID = isParis ? '89986531659' : '90749075787'; // Leasing & Wingboost : Wingboost Marseille

    const resRef = booking?.reference || bookingId.split('-')[0].toUpperCase();
    const clientName = `${booking?.customers?.first_name || ''} ${booking?.customers?.last_name || ''}`.trim();

    // Outbound (added items)
    if (addedSkus.length > 0) {
      const resolvedAdded = [];
      for (const sku of addedSkus) {
        const gid = await getInventoryItemIdBySku(sku);
        if (gid) resolvedAdded.push({ gid });
      }
      if (resolvedAdded.length > 0) {
        await transferAndReceive(
          MAIN_STORE_LOC_ID, 
          WINGBOOST_LOC_ID, 
          resolvedAdded, 
          `Ajout partiel loc ${resRef} (${clientName})`, 
          `RESA-AJOUT-${resRef}`
        );
      }
    }

    // Inbound (returned items)
    if (returnedSkus.length > 0) {
      const resolvedReturned = [];
      for (const sku of returnedSkus) {
        const gid = await getInventoryItemIdBySku(sku);
        if (gid) resolvedReturned.push({ gid });
      }
      if (resolvedReturned.length > 0) {
        await transferAndReceive(
          WINGBOOST_LOC_ID, 
          MAIN_STORE_LOC_ID, 
          resolvedReturned, 
          `Retour partiel loc ${resRef} (${clientName})`, 
          `RETOUR-PARTIEL-${resRef}`
        );
      }
    }

    return NextResponse.json({ success: true, message: "Mise à jour partielle effectuée dans Shopify" });
  } catch (err) {
    console.error('Erreur sync partielle:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
