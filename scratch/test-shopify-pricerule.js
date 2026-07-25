const fs = require('fs');

async function test() {
  const envFile = fs.readFileSync('.env.production', 'utf8');
  const envVars = {};
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      envVars[match[1]] = match[2].replace(/"/g, '').replace(/\\n/g, '').trim();
    }
  });

  const domain = envVars.SHOPIFY_STORE_DOMAIN;
  const token = envVars.SHOPIFY_ACCESS_TOKEN;

  // 2. Search for products with LOK sku
  const query = `{ products(first: 250, query: "sku:LOK-*") { edges { node { id } } } }`;
  const prodRes = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query }),
  });
  const prodData = await prodRes.json();
  
  if (prodData.data?.products?.edges) {
     const productIds = prodData.data.products.edges.map(e => parseInt(e.node.id.split('/').pop(), 10));
     console.log('Found LOK products:', productIds.length);
     console.log('Sample IDs:', productIds.slice(0, 3));
  } else {
     console.log('Response:', JSON.stringify(prodData, null, 2));
  }
}

test().catch(console.error);
