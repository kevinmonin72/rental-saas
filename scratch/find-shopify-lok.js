require('dotenv').config({ path: '.env.local' });

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  if (!token || !domain) {
    console.error("Missing token or domain");
    return;
  }

  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250&status=any`;
  let hasNext = true;
  let matches = [];

  while (hasNext) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) {
      console.error(await res.text());
      break;
    }
    const data = await res.json();
    for (const product of data.products) {
      const rentalVariants = product.variants.filter(v => v.sku && v.sku.startsWith('LOK-'));
      if (rentalVariants.length > 0 || product.title.toLowerCase().includes('location')) {
        matches.push({
          id: product.id,
          title: product.title,
          product_type: product.product_type,
          image: product.image ? product.image.src : null,
          variants: product.variants.map(v => ({
            id: v.id,
            title: v.title,
            sku: v.sku,
            image_id: v.image_id,
            price: v.price
          }))
        });
      }
    }

    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else {
      hasNext = false;
    }
  }

  console.log(`Found ${matches.length} products matching rental keywords or LOK- SKUs in Shopify:`);
  for (const p of matches) {
    console.log(`\nProduct: ${p.title} (${p.id}) - Type: ${p.product_type}`);
    console.log(`Featured Image: ${p.image}`);
    console.log("Variants:");
    p.variants.forEach(v => {
      console.log(`  - SKU: ${v.sku} | Title: ${v.title} | Price: ${v.price} | ImageID: ${v.image_id}`);
    });
  }
}

main();
