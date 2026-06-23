const fs = require('fs');
const dotenv = require('dotenv');
const crypto = require('crypto');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const webhookSecret = envConfig.SHOPIFY_WEBHOOK_SECRET;

async function testProductionWebhook() {
  const payload = {
    id: 9999999999999, // dummy ID
    email: "test-webhook-prod@gmail.com",
    line_items: [
      {
        title: "Location Test Pack",
        sku: "LOK-PACK-KITE",
        quantity: 1,
        properties: [
          { name: "Date de début", value: "2026-06-25" },
          { name: "Date de fin", value: "2026-06-30" }
        ]
      }
    ],
    customer: {
      first_name: "Test",
      last_name: "Webhook Prod",
      email: "test-webhook-prod@gmail.com"
    }
  };

  const payloadStr = JSON.stringify(payload);
  
  // Generate HMAC signature using the real secret
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(payloadStr, 'utf8')
    .digest('base64');

  console.log("Sending signed payload to production webhook...");
  
  try {
    const res = await fetch('https://rental-saas-seven.vercel.app/api/shopify/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shopify-topic': 'orders/create',
        'x-shopify-hmac-sha256': hash
      },
      body: payloadStr
    });

    console.log("Production Status:", res.status);
    const text = await res.text();
    console.log("Production Response:", text);
  } catch (err) {
    console.error("Error making request:", err);
  }
}

testProductionWebhook();
