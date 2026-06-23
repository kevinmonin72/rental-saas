require('dotenv').config({ path: '.env.local' });
async function main() {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/webhooks.json`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
main();
