require('dotenv').config({ path: '.env.local' });
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
async function run() {
  let hasNextPage = true;
  let cursor = null;
  let all = 0;
  while(hasNextPage) {
    const query = `{
      products(first: 250, sortKey: UPDATED_AT, reverse: true${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo { hasNextPage endCursor }
        edges { node { id updatedAt title variants(first: 50) { edges { node { sku } } } } }
      }
    }`;
    const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    const products = data.data.products.edges;
    all += products.length;
    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;
    console.log(`Fetched ${products.length} products, total ${all}`);
  }
}
run();
