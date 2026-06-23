
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

async function run() {
  const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const sku = "LOK-SURF";
  const query = `
    query {
      productVariants(first: 50, query: "sku:${sku}") {
        edges {
          node {
            id
            title
            sku
          }
        }
      }
    }
  `;
  const res = await fetch('https://shop-theridery.myshopify.com/admin/api/2024-01/graphql.json', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-Shopify-Access-Token': shopifyToken
     },
     body: JSON.stringify({ query })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

run();
