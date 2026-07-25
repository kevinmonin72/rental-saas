require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');

async function main() {
  console.log("Fetching order 12899612066123 from Shopify...");
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders/12899612066123.json`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN } });
  const data = await res.json();
  
  if (!data.order) {
    console.error("Order not found on Shopify:", data);
    return;
  }

  const payload = JSON.stringify(data.order);
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  const hash = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

  const targetUrl = 'https://rental-saas-seven.vercel.app/api/shopify/webhook';
  console.log(`Sending webhook to ${targetUrl}...`);

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': hash
    },
    body: payload
  });

  console.log(`Response Status: ${response.status}`);
  console.log(`Response Body:`, await response.text());
}

main();
