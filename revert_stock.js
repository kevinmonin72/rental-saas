const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.prod.vercel' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const token = process.env.SHOPIFY_ACCESS_TOKEN.trim();
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const MARSEILLE_LOC_ID = '81944215861';
const WINGBOOST_MARSEILLE_LOC_ID = '90749075787';

async function revert() {
  const { data: booking } = await supabase.from('bookings').select('id').eq('reference', 'RW0017').single();
  if (!booking) return console.log('Booking not found');
  
  const { data: items } = await supabase.from('booking_items').select('quantity, equipment (reference)').eq('booking_id', booking.id);
  
  for (const item of items) {
    const query = `query { productVariants(first: 1, query: "sku:${item.equipment.reference}") { nodes { inventoryItem { id } } } }`;
    const res = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
    const data = await res.json();
    const inventoryGid = data?.data?.productVariants?.nodes?.[0]?.inventoryItem?.id;
    if (!inventoryGid) continue;
    
    // Revert: + to Marseille, - to Wingboost
    const adjustChanges = [
      `{ inventoryItemId: "${inventoryGid}", locationId: "gid://shopify/Location/${MARSEILLE_LOC_ID}", delta: ${item.quantity} }`,
      `{ inventoryItemId: "${inventoryGid}", locationId: "gid://shopify/Location/${WINGBOOST_MARSEILLE_LOC_ID}", delta: -${item.quantity} }`
    ].join(', ');

    const moveMutation = `
      mutation {
        inventoryAdjustQuantities(
          input: {
            reason: "correction",
            name: "available",
            changes: [${adjustChanges}]
          }
        ) {
          userErrors { message }
        }
      }
    `;
    const moveRes = await fetch(`https://${domain}/admin/api/2024-10/graphql.json`, { method: 'POST', headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: moveMutation }) });
    console.log(await moveRes.json());
  }
  
  await supabase.from('bookings').update({ shopify_transfer: false }).eq('id', booking.id);
  console.log('Reverted booking shopify_transfer status');
}
revert();
