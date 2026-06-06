require('dotenv').config({ path: '.env.local' });

async function registerWebhooks() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const webhookUrl = 'https://rental-saas-seven.vercel.app/api/shopify/webhook';

  if (!token || !domain) {
    console.error("Missing credentials");
    return;
  }

  const topics = [
    'orders/create',
    'inventory_levels/update',
    'products/create',
    'products/update',
    'products/delete',
    'customers/create',
    'customers/update',
    'customers/delete'
  ];

  for (const topic of topics) {
    const res = await fetch(`https://${domain}/admin/api/2024-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify({
        webhook: {
          topic: topic,
          address: webhookUrl,
          format: 'json'
        }
      })
    });

    const data = await res.json();
    if (res.ok) {
      console.log(`✅ Webhook ${topic} registered successfully`);
    } else {
      console.error(`❌ Failed to register ${topic}:`, data);
    }
  }
}

registerWebhooks();
