require('dotenv').config({ path: '.env.production' });
const fetch = require('node-fetch');

async function fetchShopifyVariantBySku(sku, days) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const query = `{ products(first: 5, query: "sku:${sku}") { edges { node { title variants(first: 30) { edges { node { id sku price title } } } } } } }`;
  const res = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return console.log('not ok', res.status);
  const { data } = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

fetchShopifyVariantBySku('LOK-WING-BOARD', 2);
