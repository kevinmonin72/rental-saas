require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  let url = `https://${domain}/admin/api/2024-01/products.json?limit=5&order=updated_at+desc`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  const data = await res.json();
  if (data.errors) {
    console.log("Error:", data.errors);
  } else {
    data.products.forEach(p => console.log(p.title, p.updated_at));
  }
}
main();
