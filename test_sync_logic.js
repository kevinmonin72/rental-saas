require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const token = process.env.SHOPIFY_ACCESS_TOKEN;
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Starting sync...");
  let allVariantsMap = new Map();
  let hasNextPage = true;
  let cursor = null;
  let pageCount = 0;

  while (hasNextPage && pageCount < 20) {
    pageCount++;
    console.log(`Fetching page ${pageCount}... cursor: ${cursor}`);
    const query = `
    {
      products(first: 250, sortKey: UPDATED_AT, reverse: true${cursor ? `, after: "${cursor}"` : ''}) {
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            id
            title
            productType
            updatedAt
            featuredImage { url }
            variants(first: 50) {
              edges {
                node {
                  id title sku barcode
                  inventoryItem {
                    inventoryLevels(first: 50) {
                      edges {
                        node {
                          location { id }
                          quantities(names: ["available"]) { quantity }
                        }
                      }
                    }
                  }
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

    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].message);

    const products = data.data.products.edges;
    console.log(`Found ${products.length} products on page ${pageCount}`);
    
    for (const { node: product } of products) {
      for (const { node: variant } of product.variants.edges) {
        const ref = variant.sku || variant.barcode || variant.id.split('/').pop();
        if (ref) {
          let qtyMarseille = 0;
          let qtyParis = 0;
          if (variant.inventoryItem?.inventoryLevels?.edges) {
            for (const { node: level } of variant.inventoryItem.inventoryLevels.edges) {
              const locId = level.location?.id;
              const qty = level.quantities?.[0]?.quantity || 0;
              if (locId === 'gid://shopify/Location/90826146123') qtyMarseille = qty;
              if (locId === 'gid://shopify/Location/89633751371') qtyParis = qty;
            }
          }
          const baseItem = {
            reference: ref,
            name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
            category: product.productType || 'Général',
          };
          allVariantsMap.set(`${ref}-marseille`, { ...baseItem, quantity: qtyMarseille, location: 'marseille' });
          allVariantsMap.set(`${ref}-paris`, { ...baseItem, quantity: qtyParis, location: 'paris' });
        }
      }
    }

    hasNextPage = data.data.products.pageInfo.hasNextPage;
    cursor = data.data.products.pageInfo.endCursor;
  }

  const allVariants = Array.from(allVariantsMap.values());
  console.log(`Total variants (x2 locations) found in Shopify: ${allVariants.length}`);

  if (allVariants.length > 0) {
    const referencesToFetch = allVariants.map(v => v.reference);
    let currentEquipments = [];
    console.log("Fetching existing equipments from Supabase...");
    
    for (let i = 0; i < referencesToFetch.length; i += 500) {
      const chunk = referencesToFetch.slice(i, i + 500);
      const { data, error } = await supabaseAdmin
        .from('equipment')
        .select('id, reference, location')
        .in('reference', chunk);
      if (error) console.error("Supabase Error:", error);
      if (data) currentEquipments = [...currentEquipments, ...data];
    }
    console.log(`Found ${currentEquipments.length} matching equipments in Supabase.`);
    
    let toUpsertEq = [];
    let newCount = 0;
    let updateCount = 0;
    
    for (const item of allVariants) {
      const existing = currentEquipments.find(e => e.reference === item.reference && e.location === item.location);
      if (!existing) newCount++;
      else updateCount++;
      
      toUpsertEq.push({
        id: existing ? existing.id : crypto.randomUUID(),
        ...item
      });
    }

    console.log(`Will upsert ${toUpsertEq.length} items (${newCount} new, ${updateCount} existing)`);
    // NOTE: Skipping the actual upsert to not pollute DB for this test, but we can verify it finds them.
  }
}
run().catch(console.error);
