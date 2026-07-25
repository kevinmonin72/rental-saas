require('dotenv').config({ path: '.env.local' });

async function test() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  console.log("Fetching active products from Shopify...");
  let url = `https://${domain}/admin/api/2024-01/products.json?status=active&limit=250`;
  let hasNext = true;
  let allVariantsMap = new Map();

  while (hasNext) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) {
      console.error("Fetch failed", await res.text());
      break;
    }
    const data = await res.json();
    for (const product of data.products) {
      for (const variant of product.variants) {
        if (variant.sku) {
          const varImg = product.images?.find(img => img.id === variant.image_id);
          const imageUrl = varImg ? varImg.src : (product.image ? product.image.src : null);
          allVariantsMap.set(variant.sku, {
            reference: variant.sku,
            name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.replace(/\s*-\s*\d+\s*jours?\s*$/i, '').trim(),
            category: product.product_type || 'Général',
            quantity: variant.inventory_quantity || 0,
            brand: imageUrl
          });
        }
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

  console.log(`Total variants in map: ${allVariantsMap.size}`);
  const loks = Array.from(allVariantsMap.values()).filter(v => v.reference.startsWith('LOK-'));
  console.log(`LOK- variants in map: ${loks.length}`);
  loks.forEach(v => {
    console.log(`- Ref: ${v.reference} | Name: ${v.name} | Image: ${v.brand} | Qty: ${v.quantity}`);
  });
}

test();
