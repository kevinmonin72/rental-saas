import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // Assure-toi que ce chemin est correct selon ta config
import crypto from 'crypto';

export async function POST(req) {
  try {
    // 1. Récupérer le corps de la requête
    const bodyText = await req.text();
    const data = JSON.parse(bodyText);

    // 2. (Optionnel mais recommandé) Vérifier la signature Shopify pour la sécurité
    // Il te faudra ajouter ton SHOPIFY_WEBHOOK_SECRET dans le fichier .env.local
    const shopifySignature = req.headers.get('x-shopify-hmac-sha256');
    const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

    if (webhookSecret && shopifySignature) {
      const hash = crypto
        .createHmac('sha256', webhookSecret)
        .update(bodyText, 'utf8')
        .digest('base64');
        
      if (hash !== shopifySignature) {
        console.error("Signature invalide !");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // 3. Traiter les données reçues
    // Si tu utilises le webhook "inventory_levels/update" :
    // La data contiendra : inventory_item_id, available, location_id
    console.log("Webhook Shopify reçu :", data);

    const { inventory_item_id, available } = data;

    // 4. Interroger Shopify pour obtenir le SKU correspondant à cet inventory_item_id
    const shopifyDomain = process.env.SHOPIFY_STORE_DOMAIN || 'theridery.myshopify.com';
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!shopifyToken) {
      console.error("Token Shopify manquant dans les variables d'environnement");
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const shopifyRes = await fetch(`https://${shopifyDomain}/admin/api/2024-01/inventory_items/${inventory_item_id}.json`, {
      headers: {
        'X-Shopify-Access-Token': shopifyToken,
        'Content-Type': 'application/json'
      }
    });

    if (!shopifyRes.ok) {
      console.error("Erreur lors de la récupération du SKU depuis Shopify:", await shopifyRes.text());
      return NextResponse.json({ error: 'Failed to fetch SKU' }, { status: 500 });
    }

    const shopifyItemData = await shopifyRes.json();
    const sku = shopifyItemData.inventory_item?.sku;

    if (!sku) {
      console.log(`Aucun SKU trouvé pour l'inventory_item_id ${inventory_item_id}`);
      // On renvoie 200 pour que Shopify n'essaie pas de renvoyer le webhook en boucle
      return NextResponse.json({ message: 'No SKU found, ignored' }, { status: 200 });
    }

    // 5. Mettre à jour Supabase grâce au SKU (colonne "reference")
    console.log(`Mise à jour dans Supabase : article ${sku} -> nouvelle quantité : ${available}`);
    const { error: supabaseError } = await supabase
      .from('equipment')
      .update({ quantity: available })
      .eq('reference', sku);
      
    if (supabaseError) {
      console.error("Erreur Supabase:", supabaseError);
      throw supabaseError;
    }

    return NextResponse.json({ message: 'Webhook traité avec succès' }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors du traitement du webhook Shopify:", error);
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 });
  }
}
