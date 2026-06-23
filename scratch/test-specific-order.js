const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  // Let's search for order #7478 and #7411
  for (const name of ['#7478', '#7411', '#7872']) {
    const url = `https://${domain}/admin/api/2024-01/orders.json?status=any&name=${encodeURIComponent(name)}`;
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    const data = await res.json();
    console.log(`Search for ${name}: found ${data.orders?.length || 0} orders.`);
    if (data.orders && data.orders.length > 0) {
      console.log(`- Created at: ${data.orders[0].created_at}, Total: ${data.orders[0].total_price}`);
    }
  }
}

main().catch(console.error);
