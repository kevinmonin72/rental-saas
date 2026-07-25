require('dotenv').config({ path: '.env.prod.vercel' });
const fetch = require('node-fetch');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();
const API_VERSION = '2024-10';

async function test() {
  const query = `
    query {
      inventoryTransfers(first: 1) {
        nodes {
          id
          shipments(first: 1) {
            edges { node { id } }
          }
        }
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
