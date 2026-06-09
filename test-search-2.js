require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  // Let's fetch all products updated in the last 2 days to see what they added recently!
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  console.log(`Fetching products updated since ${twoDaysAgo}`);
  
  const res = await fetch(`https://${domain}/admin/api/2024-01/products.json?updated_at_min=${twoDaysAgo}`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  if (!data.products) {
    console.log("No products returned or error:", data);
    return;
  }
  
  console.log(`Found ${data.products.length} products updated recently.`);
  data.products.forEach(p => {
    console.log(`\nProduct: ${p.title} (Status: ${p.status}, updated_at: ${p.updated_at})`);
    p.variants.forEach(v => {
      console.log(`  - Variant: ${v.title} | SKU: ${v.sku}`);
    });
  });
}
main();
