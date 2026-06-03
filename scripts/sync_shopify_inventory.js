const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function syncShopify() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!token) {
    console.error("Token Shopify manquant dans .env.local");
    return;
  }

  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;
  let hasNext = true;
  let allVariants = [];

  console.log("📡 Récupération des produits depuis Shopify...");

  while (hasNext) {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    
    if (!res.ok) {
      console.error("❌ Erreur Shopify :", await res.text());
      return;
    }
    
    const data = await res.json();
    for (const product of data.products) {
      for (const variant of product.variants) {
        // On n'importe que les articles qui ont un SKU
        if (variant.sku) {
           allVariants.push({
             reference: variant.sku,
             name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
             category: product.product_type || 'Général',
             quantity: variant.inventory_quantity || 0,
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

  console.log(`📦 ${allVariants.length} articles avec SKU trouvés sur Shopify.`);
  console.log("⚙️ Synchronisation avec Supabase en cours...");

  let ajouts = 0;
  let maj = 0;

  for (const item of allVariants) {
    // Vérifier si l'article existe déjà
    const { data: existing } = await supabase
      .from('equipment')
      .select('id')
      .eq('reference', item.reference)
      .single();

    if (existing) {
       await supabase.from('equipment').update({
         quantity: item.quantity,
         name: item.name,
         category: item.category
       }).eq('id', existing.id);
       maj++;
    } else {
       await supabase.from('equipment').insert({
          id: crypto.randomUUID(),
          ...item
       });
       ajouts++;
    }
  }
  
  console.log("✅ Synchronisation terminée !");
  console.log(`➡️ ${ajouts} nouveaux équipements ajoutés.`);
  console.log(`🔄 ${maj} équipements mis à jour.`);
}

syncShopify();
