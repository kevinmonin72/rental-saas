const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const payload = JSON.stringify({
  email: "kevin.monin72@gmail.com",
  line_items: [
    { sku: "LOK-PACK-KITE", title: "Location: LOK-PACK-KITE", quantity: 1 }
  ]
});

const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
const hash = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

async function test() {
  const res = await fetch('http://localhost:3000/api/shopify/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-shopify-topic': 'orders/create',
      'x-shopify-hmac-sha256': hash
    },
    body: payload
  });
  console.log(res.status, await res.text());
}
test();
