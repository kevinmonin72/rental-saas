require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const query = `
  {
    products(first: 250, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          title
          createdAt
          status
          variants(first: 10) {
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
  const products = data.data.products.edges.map(e => e.node);
  const found = products.filter(p => p.variants.edges.some(v => v.node.sku === '0606262'));
  console.log("Found via GraphQL sortKey=UPDATED_AT:", found.length > 0 ? found : "NO");
}
main();
