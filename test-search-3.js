require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const res = await fetch(`https://${domain}/admin/api/2024-01/products.json?limit=250`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  let found = false;
  data.products.forEach(p => {
    if (p.title.includes('06') || p.id.toString().includes('0606')) {
       console.log("Found:", p.title);
       found = true;
    }
  });
  if (!found) console.log("Not found in first 250");
}
main();
