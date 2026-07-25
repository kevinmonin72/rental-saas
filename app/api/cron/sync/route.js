import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // Allow up to 5 minutes


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
      headers: { 'X-Shopify-Access-Token': token },
      cache: 'no-store'
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

  // Fetch all existing equipment at once with pagination to avoid limits
  let existingEqData = [];
  let from = 0;
  const limit = 1000;
  while (true) {
    const { data, error: eqErr } = await supabase.from('equipment').select('id, reference').range(from, from + limit - 1);
    if (eqErr) {
      console.error("❌ [CRON] Erreur récupération équipement:", eqErr);
      return NextResponse.json({ error: "Erreur DB" }, { status: 500 });
    }
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

  const toUpsertMap = new Map();

  for (const item of allVariants) {
    const existingId = existingByRef.get(item.reference);

    if (existingId) {
       toUpsertMap.set(existingId, {
         id: existingId,
         quantity: item.quantity,
         name: item.name,
         category: item.category,
         brand: item.brand,
         reference: item.reference
       });
       maj++;
    } else {
       const newId = crypto.randomUUID();
       toUpsertMap.set(newId, {
          id: newId,
          ...item
       });
       existingByRef.set(item.reference, newId);
       ajouts++;
    }
  }
  
  const toUpsert = Array.from(toUpsertMap.values());
  console.log(`Préparation de ${toUpsert.length} lignes pour l'upsert...`);

  // Bulk upsert in chunks to avoid payload too large errors
  const chunkSize = 500;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const { error } = await supabase.from('equipment').upsert(chunk);
    if (error) {
       console.error("❌ [CRON] Erreur lors de l'upsert d'un lot :", error);
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
