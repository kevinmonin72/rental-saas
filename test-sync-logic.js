require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const query = `
  {
    products(first: 250, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          title
          productType
          updatedAt
          variants(first: 50) {
            edges {
              node {
                id
                title
                sku
                barcode
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  }`;

  const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });
  const data = await res.json();
  const products = data.data.products.edges;
  let allVariantsMap = new Map();
  
  for (const { node: product } of products) {
    if (new Date(product.updatedAt) < new Date(thirtyDaysAgo)) break;
    for (const { node: variant } of product.variants.edges) {
      const ref = variant.sku || variant.barcode || variant.id.split('/').pop();
      if (ref === '0606262') console.log("FOUND 0606262 in Shopify!");
      if (ref) {
        allVariantsMap.set(ref, {
          reference: ref,
          name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
          category: product.productType || 'Général',
          quantity: variant.inventoryQuantity || 0,
        });
      }
    }
  }

  const allVariants = Array.from(allVariantsMap.values());
  console.log("Variants found:", allVariants.length);
  
  const { data: currentEquipments } = await supabaseAdmin.from('equipment').select('id, reference');
  console.log("Current equipments fetched from Supabase:", currentEquipments.length);
  
  let toUpsertEq = [];
  for (const item of allVariants) {
    const existing = currentEquipments.find(e => e.reference === item.reference);
    if (item.reference === '0606262') {
      console.log("0606262 existing ID:", existing ? existing.id : 'None - will generate UUID');
    }
    toUpsertEq.push({
      id: existing ? existing.id : require('crypto').randomUUID(),
      ...item
    });
  }

  for (let i = 0; i < toUpsertEq.length; i += 500) {
    const chunk = toUpsertEq.slice(i, i + 500);
    const { error } = await supabaseAdmin.from('equipment').upsert(chunk);
    if (error) console.log("UPSERT ERROR:", error);
    else console.log(`Upserted chunk ${i/500 + 1}`);
  }
}
main();
