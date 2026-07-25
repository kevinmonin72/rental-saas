const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const orderId = 999999999;

const makePayload = (status) => JSON.stringify({
  id: orderId,
  name: "#9999",
  email: "kevin.monin72@gmail.com",
  financial_status: status,
  line_items: [
    { 
      sku: "LOK-PACK-KITE", 
      title: "Location: LOK-PACK-KITE", 
      quantity: 1,
      properties: [
        { name: "Début", value: "2026-06-25" },
        { name: "Fin", value: "2026-06-28" }
      ]
    }
  ]
});

const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

async function sendWebhook(topic, payloadText) {
  const hash = crypto.createHmac('sha256', secret).update(payloadText, 'utf8').digest('base64');
  const res = await fetch('http://localhost:3000/api/shopify/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-topic': topic,
      'x-shopify-hmac-sha256': hash
    },
    body: payloadText
  });
  console.log(`Topic: ${topic} | Status: ${res.status} | Response:`, await res.text());
}

async function run() {
  console.log("1. Sending unpaid orders/create webhook...");
  await sendWebhook('orders/create', makePayload('pending'));

  console.log("\n2. Sending paid orders/paid webhook...");
  await sendWebhook('orders/paid', makePayload('paid'));
}

run();
