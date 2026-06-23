const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const query = `
  {
    orders(first: 10, query: "created_at:>=2026-01-01", sortKey: CREATED_AT) {
      edges {
        node {
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
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

main().catch(console.error);
