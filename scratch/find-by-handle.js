require('dotenv').config({ path: '.env.local' });

async function checkHandle(handle) {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  // Try fetching without status first, then test draft/archived
  const statuses = ['active', 'draft', 'archived'];
  for (const status of statuses) {
    const url = `https://${domain}/admin/api/2024-01/products.json?handle=${handle}&status=${status}`;
    try {
      const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        console.log(`FOUND ${handle} with status ${status}:`);
        console.log(JSON.stringify(data.products[0], null, 2));
        return;
      }
    } catch (err) {
      console.error(err);
    }
  }
  console.log(`Could not find product with handle: ${handle}`);
}

async function run() {
  await checkHandle('location-boardbag');
  await checkHandle('location-boardbag-opt');
}

run();
