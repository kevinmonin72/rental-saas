require('dotenv').config({ path: '.env.prod.vercel' });

function durationToVariantTitle(days) {
  if (days <= 0.5) return 'Demi-journée';
  if (days === 1) return '1 jour';
  return `${days} jours`;
}

async function fetchShopifyVariantBySku(sku, days) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();
  const query = `{ products(first: 5, query: "sku:${sku}") { edges { node { title variants(first: 30) { edges { node { id sku price title } } } } } } }`;
  const res = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) return null;
  const { data } = await res.json();
  const products = data?.products?.edges?.map(e => e.node) || [];
  if (products.length === 0) return null;
  let product = products.find(p => p.variants.edges.some(e => e.node.sku === sku));
  if (!product) product = products[0];
  const variants = product.variants.edges.map(e => e.node);
  const targetTitle = durationToVariantTitle(days).toLowerCase();
  let variant = variants.find(v => v.title.toLowerCase() === targetTitle || v.title.toLowerCase().replace('-', '') === targetTitle.replace('-', ''));
  if (!variant && days > 1) {
    const dayVariants = variants
      .map(v => {
        const m = v.title.toLowerCase().match(/^(\d+)\s+jours?$/);
        return m ? { ...v, days: parseInt(m[1]) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);
    variant = dayVariants.find(v => v.days >= days) || dayVariants[dayVariants.length - 1];
  }
  
  if (!variant) {
    if (variants.length > 0) variant = variants[0];
    else return null;
  }
  
  return {
    price: variant.price,
    title: `${product.title} — ${variant.title}`,
  };
}

async function run() {
  const res = await fetchShopifyVariantBySku('LOK-PACK-WING-RIGIDE', 4);
  console.log("Result:", res);
}
run();
