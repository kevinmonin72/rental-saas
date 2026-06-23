import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET(request) {
  // Check authorization header to ensure it's Vercel Cron calling
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: "Token Shopify manquant" }, { status: 500 });
  }

  let url = `https://${domain}/admin/api/2024-01/products.json?limit=250`;
  let hasNext = true;
  let allVariants = [];

  console.log("📡 [CRON] Récupération des produits depuis Shopify...");

  while (hasNext) {
    const res = await fetch(url, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    
    if (!res.ok) {
      console.error("❌ [CRON] Erreur Shopify :", await res.text());
      return NextResponse.json({ error: "Erreur Shopify" }, { status: 500 });
    }
    
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

  console.log(`📦 [CRON] ${allVariants.length} articles avec SKU trouvés sur Shopify.`);
  console.log("⚙️ [CRON] Synchronisation avec Supabase en cours...");

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
         category: item.category,
         brand: item.brand
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
  
  console.log("✅ [CRON] Synchronisation terminée !");
  
  return NextResponse.json({ 
    success: true, 
    ajouts, 
    maj,
    message: `${ajouts} ajouts, ${maj} mises à jour`
  });
}
