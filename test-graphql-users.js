require('dotenv').config();
const fetch = require('node-fetch');

const query = `
  query {
    staffMembers(first: 20) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

fetch('https://shop-theridery.myshopify.com/admin/api/2024-01/graphql.json', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN
  },
  body: JSON.stringify({ query })
}).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
