require('dotenv').config({ path: '.env.local' });

async function run() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const statuses = ['active', 'draft', 'archived'];
  let allProducts = [];
  
  for (const status of statuses) {
    let url = `https://${domain}/admin/api/2024-01/products.json?limit=250&status=${status}`;
    try {
      const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
      if (res.ok) {
        const data = await res.json();
        allProducts = allProducts.concat(data.products);
      }
    } catch (err) {
      console.error(err);
    }
  }
  
  console.log(`Scanning ${allProducts.length} total products from Shopify:`);
  let found = false;
  for (const p of allProducts) {
    if (p.handle.includes('boardbag')) {
      console.log(`- Title: "${p.title}" | Handle: "${p.handle}" | Status: "${p.status}" | ID: ${p.id}`);
      found = true;
    }
  }
  if (!found) {
    console.log("No product handles contain 'boardbag'");
  }
}

run();
