const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const token = envConfig.SHOPIFY_ACCESS_TOKEN;

async function testDraftDiscount() {
  const payload = {
    draft_order: {
      line_items: [
        {
          title: "Location Test Equipment",
          price: "100.00",
          quantity: 1,
          sku: "LOK-TEST"
        }
      ],
      email: "kevin.monin72@gmail.com",
      tags: "test_discount",
      applied_discount: {
        description: "Code promo",
        value_type: "percentage",
        value: "100.0",
        title: "FULL100"
      }
    }
  };

  console.log("Sending payload to Shopify:", JSON.stringify(payload, null, 2));

  try {
    const res = await fetch('https://shop-theridery.myshopify.com/admin/api/2024-01/draft_orders.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    console.log("Shopify Response Status:", res.status);
    console.log("Shopify Response Payload:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

testDraftDiscount();
