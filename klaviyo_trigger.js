import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const klaviyoKey = process.env.KLAVIYO_API_KEY;
  if (!klaviyoKey) {
    console.log("No KLAVIYO_API_KEY");
    return;
  }
  
  console.log("Triggering event to Klaviyo...");
  const response = await fetch('https://a.klaviyo.com/api/events/', {
    method: 'POST',
    headers: {
      'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
      'accept': 'application/json',
      'content-type': 'application/json',
      'revision': '2024-02-15'
    },
    body: JSON.stringify({
      data: {
        type: 'event',
        attributes: {
          profile: {
            $email: 'kevin.monin72@gmail.com'
          },
          metric: {
            name: 'Generated Promo Code'
          },
          properties: {
            PromoCode: 'TEST20',
            DiscountValue: '20',
            DiscountType: 'percentage',
            DiscountText: '20%'
          }
        }
      }
    })
  });

  if (response.ok) {
    console.log("Success! Event sent to Klaviyo.");
  } else {
    const err = await response.text();
    console.log("Error:", response.status, err);
  }
}

main();
