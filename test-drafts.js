require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://${domain}/admin/api/2024-01/products.json?status=draft&updated_at_min=${twoDaysAgo}`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  console.log(`Found ${data.products ? data.products.length : 0} draft products updated recently.`);
  if (data.products) {
    data.products.forEach(p => {
      console.log(`Product: ${p.title} | Status: ${p.status}`);
      p.variants.forEach(v => {
        console.log(`  - Variant: ${v.title} | SKU: ${v.sku}`);
      });
    });
  }
}
main();
