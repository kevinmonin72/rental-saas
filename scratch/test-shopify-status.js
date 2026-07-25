require('dotenv').config({ path: '.env.local' });

async function testStatus(status) {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250&status=${status}`;
  let matches = [];
  
  console.log(`Checking products with status: ${status}...`);
  try {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) {
      console.error(`Error fetching ${status}:`, await res.text());
      return;
    }
    const data = await res.json();
    for (const product of data.products) {
      if (product.title.toLowerCase().includes('boardbag')) {
        matches.push({
          id: product.id,
          title: product.title,
          status: product.status,
          sku: product.variants.map(v => v.sku)
        });
      }
    }
    console.log(`Found ${matches.length} matching products for status ${status}:`, JSON.stringify(matches, null, 2));
  } catch (err) {
    console.error(err);
  }
}

async function run() {
  await testStatus('active');
  await testStatus('draft');
  await testStatus('archived');
}

run();
