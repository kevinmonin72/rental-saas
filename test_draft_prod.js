require('dotenv').config({ path: '.env.prod.vercel' });
const fetch = require('node-fetch');

async function run() {
  const res = await fetch('https://rental-saas-seven.vercel.app/api/stripe/draft-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: '3f6d4fc0-c7cd-44bb-b37d-dfe35d89feca' }) // 4 day booking with LOK-PACK-WING-RIGIDE
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
