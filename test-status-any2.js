require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let url = `https://${domain}/admin/api/2024-01/products.json?status=any&limit=250&updated_at_min=${thirtyDaysAgo}`;
  let hasNext = true;
  let pageCount = 0;
  
  console.log("Searching all Shopify products for 0606262...");
  while (hasNext && pageCount < 5) {
    pageCount++;
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) { console.log(await res.text()); break; }
    const data = await res.json();
    
    data.products.forEach(p => {
      p.variants.forEach(v => {
        if (v.sku === '0606262') {
           console.log(`FOUND in REST API page ${pageCount}:`, p.title, v.sku);
        }
      });
    });
    
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else hasNext = false;
  }
  console.log("Finished searching REST API with status=any and updated_at_min.");
}
main();
