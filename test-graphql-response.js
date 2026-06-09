require('dotenv').config({ path: '.env.local' });
async function main() {
  const query = `
  {
    products(first: 1, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          variants(first: 1) {
            edges {
              node {
                id
                sku
                barcode
              }
            }
          }
        }
      }
    }
  }`;
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
