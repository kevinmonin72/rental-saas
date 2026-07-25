import dotenv from 'dotenv';
dotenv.config({ path: '.env.prod.vercel' });

async function test() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const query = `{ products(first: 20, query: "tag:location OR title:location OR title:wingboost") { edges { node { id title variants(first: 5) { edges { node { sku price title } } } } } } }`;
  const res = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query }),
  });
  const json = await res.json();
  console.dir(json.data.products.edges, { depth: null });
}
test();
