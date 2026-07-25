require('dotenv').config({ path: '.env.prod.vercel' });
const fetch = require('node-fetch');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'shop-theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();

async function test() {
  const res = await fetch(`https://${SHOPIFY_DOMAIN}/admin/oauth/access_scopes.json`, {
    headers: { 'X-Shopify-Access-Token': SHOPIFY_TOKEN }
  });
  const data = await res.json();
  console.log(data);
}
test();
