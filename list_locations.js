require('dotenv').config({ path: '.env.local' });
async function getLocations() {
  const query = `
    query {
      locations(first: 10) {
        edges {
          node {
            id
            name
          }
        }
      }
    }
  `;
  const res = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com'}/admin/api/2024-10/graphql.json`, {
    method: 'POST',
    headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
getLocations();
