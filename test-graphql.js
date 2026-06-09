require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const query = `
  {
    products(first: 5, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          title
          createdAt
          status
          variants(first: 5) {
            edges {
              node {
                sku
                barcode
              }
            }
          }
        }
      }
    }
  }`;

  const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
