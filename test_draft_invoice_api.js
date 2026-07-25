require('dotenv').config({ path: '.env.prod.vercel' });
const { POST } = require('./app/api/stripe/draft-invoice/route.js');

async function run() {
  const req = {
    json: async () => ({ bookingId: '3f6d4fc0-c7cd-44bb-b37d-dfe35d89feca' })
  };
  const res = await POST(req);
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Response:", data);
}
// Note: We can't easily run Next.js routes like this if they use next/server NextResponse.
// I will just use fetch to localhost if the server is running, or directly to production.
