const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.prod.vercel' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;
  let hasNext = true;
  let allVariants = [];

  console.log("Fetching Shopify products...");
  while (hasNext) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    const data = await res.json();
    for (const product of data.products) {
      for (const variant of product.variants) {
        if (variant.sku) {
           const varImg = product.images?.find(img => img.id === variant.image_id);
           const imageUrl = varImg ? varImg.src : (product.image ? product.image.src : null);
           
           allVariants.push({
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

  console.log(`Found ${allVariants.length} variants on Shopify.`);
  
  let existingEqData = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error: eqErr } = await supabase.from('equipment').select('id, reference').range(from, from + limit - 1);
    if (!data || data.length === 0) break;
    existingEqData = existingEqData.concat(data);
    from += limit;
  }

  const existingByRef = new Map();
  for (const eq of existingEqData) {
    if (eq.reference) {
      existingByRef.set(eq.reference, eq.id);
    }
  }

  let ajouts = 0;
  let maj = 0;
  
  console.log("Syncing to DB...");
  for (const item of allVariants) {
    const existingId = existingByRef.get(item.reference);
    if (existingId) {
       await supabase.from('equipment').update({
         quantity: item.quantity,
         name: item.name,
         category: item.category,
         brand: item.brand
       }).eq('id', existingId);
       maj++;
    } else {
       const newId = crypto.randomUUID();
       await supabase.from('equipment').insert({ id: newId, ...item });
       existingByRef.set(item.reference, newId);
       ajouts++;
    }
  }
  
  console.log(`Done! Added: ${ajouts}, Updated: ${maj}`);
}
run();
