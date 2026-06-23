require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!token || !domain) {
    console.error('Shopify credentials missing');
    return;
  }

  console.log("Connecting to Shopify domain:", domain);
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    let allVariantsMap = new Map();
    let hasNextPage = true;
    let cursor = null;
    let pageCount = 0;

    while (hasNextPage && pageCount < 5) {
      pageCount++;
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
              featuredImage {
                url
              }
              variants(first: 50) {
                edges {
                  node {
                    id
                    title
                    sku
                    barcode
                    inventoryQuantity
                    image {
                      url
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
      console.log(`Fetched page ${pageCount} with ${products.length} products`);
      for (const { node: product } of products) {
        for (const { node: variant } of product.variants.edges) {
          const ref = variant.sku || variant.barcode || variant.id.split('/').pop();
          if (ref) {
            const imageUrl = variant.image?.url || product.featuredImage?.url || null;
            allVariantsMap.set(ref, {
              reference: ref,
              name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
              category: product.productType || 'Général',
              quantity: variant.inventoryQuantity || 0,
              brand: imageUrl
            });
          }
        }
      }

      hasNextPage = data.data.products.pageInfo.hasNextPage;
      cursor = data.data.products.pageInfo.endCursor;
    }

    const allVariants = Array.from(allVariantsMap.values());
    console.log(`Total variants fetched from Shopify: ${allVariants.length}`);
    
    const lokVariants = allVariants.filter(v => v.reference.startsWith('LOK-'));
    console.log(`Total LOK- variants fetched: ${lokVariants.length}`);
    
    // Check if any of the LOK- variants has an image
    const withImg = lokVariants.filter(v => v.brand);
    console.log(`LOK- variants with image: ${withImg.length}`);
    if (withImg.length > 0) {
      console.log("Examples with image:");
      console.log(JSON.stringify(withImg.slice(0, 3), null, 2));
    }

    if (allVariants.length > 0) {
      const referencesToFetch = allVariants.map(v => v.reference);
      let currentEquipments = [];
      
      for (let i = 0; i < referencesToFetch.length; i += 500) {
        const chunk = referencesToFetch.slice(i, i + 500);
        const { data, error } = await supabaseAdmin
          .from('equipment')
          .select('id, reference')
          .in('reference', chunk);
        if (data) currentEquipments = [...currentEquipments, ...data];
      }
      
      let toUpsertEq = [];
      for (const item of allVariants) {
        const existing = currentEquipments.find(e => e.reference === item.reference);
        toUpsertEq.push({
          id: existing ? existing.id : require('crypto').randomUUID(),
          ...item
        });
      }

      console.log(`Upserting ${toUpsertEq.length} items to database...`);
      for (let i = 0; i < toUpsertEq.length; i += 500) {
        const chunk = toUpsertEq.slice(i, i + 500);
        const { error } = await supabaseAdmin.from('equipment').upsert(chunk);
        if (error) {
          console.error("Upsert error:", error);
        }
      }
      console.log("Database sync completed successfully!");
    }
  } catch (err) {
    console.error("Sync error:", err);
  }
}
main();
