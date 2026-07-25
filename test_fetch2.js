require('dotenv').config({ path: '.env.production' });
const fetch = require('node-fetch');

function durationToVariantTitle(days) {
  if (days <= 0.5) return 'Demi-journée';
  if (days === 1) return '1 jour';
  return `${days} jours`;
}

async function fetchShopifyVariantBySku(sku, days) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
  const token = process.env.SHOPIFY_ACCESS_TOKEN.trim();
  const query = `{
    productVariants(first: 50, query: "sku:${sku}") {
      edges {
        node {
          id
          sku
          price
          title
          product {
            title
          }
        }
      }
    }
  }`;
  
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
