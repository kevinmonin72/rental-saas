const fs = require('fs');
const dotenv = require('dotenv');
const crypto = require('crypto');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const token = envConfig.SHOPIFY_ACCESS_TOKEN;
const webhookSecret = envConfig.SHOPIFY_WEBHOOK_SECRET;

async function run() {
  const orderId = "12895083069771";
  
  // Fetch real order from Shopify
  const shopifyRes = await fetch(`https://shop-theridery.myshopify.com/admin/api/2024-01/orders/${orderId}.json`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  
  const orderData = await shopifyRes.json();
  const payloadStr = JSON.stringify(orderData.order);
  
  // Generate HMAC signature
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadStr, 'utf8')
    .digest('base64');
  
  // POST to local dev webhook
  console.log("Sending order webhook to localhost:3002...");
  const res = await fetch('http://localhost:3002/api/shopify/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': hash
    },
    body: payloadStr
  });
  
  console.log("Status:", res.status);
  console.log("Response:", await res.text());
}

run();
