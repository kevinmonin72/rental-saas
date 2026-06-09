require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(`https://${domain}/admin/api/2024-01/products.json?updated_at_min=${twoDaysAgo}`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  data.products.forEach(p => {
    p.variants.forEach(v => {
      console.log(`Product: ${p.title} | Variant: ${v.title} | SKU: ${v.sku} | Barcode: ${v.barcode} | ID: ${v.id}`);
    });
  });
}
main();
