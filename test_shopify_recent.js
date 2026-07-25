require('dotenv').config({ path: '.env.production' });
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
async function run() {
  const query = `{
    products(first: 5, sortKey: UPDATED_AT, reverse: true) {
      edges { node { id title updatedAt variants(first: 5) { edges { node { sku } } } } }
    }
  }`;
  const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
