require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;
  let hasNext = true;
  let found = [];
  let checked = 0;
  
  console.log("Searching all Shopify products for 0606262...");
  while (hasNext) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) { console.log(await res.text()); break; }
    const data = await res.json();
    checked += data.products.length;
    data.products.forEach(p => {
      p.variants.forEach(v => {
        if (v.sku && v.sku.includes('0606')) found.push({ title: p.title, sku: v.sku, updated: p.updated_at });
      });
      if (p.title.includes('0606')) found.push({ title: p.title, updated: p.updated_at });
    });
    
    if (found.length > 0) break; // stop early if found
    
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else hasNext = false;
  }
  console.log(`Checked ${checked} products.`);
  console.log("Found in Shopify:", found);
}
main();
