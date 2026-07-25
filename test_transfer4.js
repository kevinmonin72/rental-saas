require('dotenv').config({ path: '.env.prod.vercel' });
const fetch = require('node-fetch');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();
const API_VERSION = '2024-10';

async function test() {
  const vres = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `{ products(first:1) { nodes { variants(first:1) { nodes { inventoryItem { id } } } } } }` })
  });
  const vdata = await vres.json();
  const iid = vdata.data.products.nodes[0].variants.nodes[0].inventoryItem.id;

  const query = `
    mutation {
      inventoryTransferCreateAsReadyToShip(input: {
        originLocationId: "gid://shopify/Location/81944215861",
        destinationLocationId: "gid://shopify/Location/90749075787",
        lineItems: [{ inventoryItemId: "${iid}", quantity: 1 }],
        note: "TEST",
        referenceName: "TEST"
      }) {
        inventoryTransfer { 
          id 
          name
          shipments(first: 1) { edges { node { id } } }
        }
        userErrors { field message }
      }
    }
  `;
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
test();
