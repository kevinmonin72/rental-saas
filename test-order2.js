require('dotenv').config({ path: '.env.local' });
async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250&status=any&updated_at_min=2026-06-05T00:00:00Z`;
  let hasNext = true;
  let count = 0;
  while(hasNext) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    const data = await res.json();
    count += data.products.length;
    data.products.forEach(p => {
      p.variants.forEach(v => {
        if(v.sku === '0606262') console.log("FOUND without order:", p.title);
      })
    });
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else hasNext = false;
  }
  console.log("Total updated since June 5:", count);
}
main();
