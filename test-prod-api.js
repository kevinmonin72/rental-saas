require('dotenv').config({ path: '.env.local' });
const { SignJWT } = require('jose');
async function main() {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure');
  const sessionToken = await new SignJWT({ role: 'admin', email: 'hello@theridery.com' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
  
  console.log("Calling production sync API...");
  const res = await fetch('https://rental-saas-seven.vercel.app/api/sync/shopify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `admin_session=${sessionToken}`
    },
    body: JSON.stringify({ type: 'inventory' })
  });
  
  if (res.ok) {
    const data = await res.json();
    console.log("Sync success:", data);
  } else {
    console.log("Sync failed:", res.status, await res.text());
  }
}
main();
