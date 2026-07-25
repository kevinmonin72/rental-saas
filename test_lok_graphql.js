require('dotenv').config({ path: '.env.prod.vercel' });
const fetch = require('node-fetch');

const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();

async function run() {
  const query = `{ products(first: 5, query: "sku:LOK-PACK-WING-RIGIDE") { edges { node { title variants(first: 30) { edges { node { id sku price title } } } } } } }`;
  const res = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query }),
  });
  const { data } = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
