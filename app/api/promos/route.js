import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('promo_codes').select('*').eq('type', 'location').order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const promoData = await req.json();
    const { error } = await supabaseAdmin.from('promo_codes').insert([{ ...promoData, type: 'location' }]);
    if (error) throw error;

    // Create in Shopify if configured
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN?.replace(/\\n/g, '').trim();
    
    if (domain && token) {
      let value = promoData.discount_type === 'percentage' 
        ? `-${promoData.discount_value}`
        : `-${promoData.discount_value}`;
      let value_type = promoData.discount_type === 'percentage' ? 'percentage' : 'fixed_amount';

      const priceRulePayload = {
        price_rule: {
          title: promoData.code,
          target_type: "line_item",
          target_selection: "entitled",
          allocation_method: "across",
          value_type: value_type,
          value: value,
          customer_selection: promoData.target_email ? "prerequisite" : "all",
          starts_at: new Date().toISOString()
        }
      };

      if (promoData.max_uses) {
        priceRulePayload.price_rule.usage_limit = promoData.max_uses;
      }

      // 1. Restriction au client si email fourni
      if (promoData.target_email) {
        let customerFound = false;
        try {
          const custRes = await fetch(`https://${domain}/admin/api/2024-04/customers/search.json?query=email:${promoData.target_email}`, {
            headers: { 'X-Shopify-Access-Token': token }
          });
          if (custRes.ok) {
            const custData = await custRes.json();
            if (custData.customers && custData.customers.length > 0) {
              priceRulePayload.price_rule.prerequisite_customer_ids = [custData.customers[0].id];
              customerFound = true;
            }
          }
        } catch (e) {
          console.error("Shopify customer search error:", e);
        }

        if (!customerFound) {
          await supabaseAdmin.from('promo_codes').delete().eq('code', promoData.code);
          return NextResponse.json({ error: `Impossible de créer le code sur Shopify : le client avec l'email ${promoData.target_email} est introuvable sur Shopify.` }, { status: 400 });
        }
      }

      // 2. Restriction aux produits LOK (jusqu'à 250 produits via GraphQL)
      let productsFound = false;
      try {
        const query = `{ products(first: 250, query: "sku:LOK-*") { edges { node { id } } } }`;
        const prodRes = await fetch(`https://${domain}/admin/api/2024-04/graphql.json`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
          body: JSON.stringify({ query }),
        });
        if (prodRes.ok) {
          const prodData = await prodRes.json();
          if (prodData.data?.products?.edges) {
            const productIds = prodData.data.products.edges.map(e => parseInt(e.node.id.split('/').pop(), 10));
            if (productIds.length > 0) {
              priceRulePayload.price_rule.entitled_product_ids = productIds;
              productsFound = true;
            }
          }
        }
      } catch (e) {
         console.error("Shopify product search error:", e);
      }

      if (!productsFound) {
        await supabaseAdmin.from('promo_codes').delete().eq('code', promoData.code);
        return NextResponse.json({ error: `Impossible de créer le code sur Shopify : Aucun produit avec un SKU commençant par "LOK-" n'a été trouvé.` }, { status: 400 });
      }

      const resRule = await fetch(`https://${domain}/admin/api/2024-04/price_rules.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
        body: JSON.stringify(priceRulePayload),
      });

      if (resRule.ok) {
        const { price_rule } = await resRule.json();
        const resCode = await fetch(`https://${domain}/admin/api/2024-04/price_rules/${price_rule.id}/discount_codes.json`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
           body: JSON.stringify({
             discount_code: { code: promoData.code }
           })
        });
        if (!resCode.ok) {
          const errText = await resCode.text();
          console.error("Erreur création Discount Code:", errText);
          // Non-bloquant si le price rule a marché, mais on log
        }
      } else {
        const errorText = await resRule.text();
        console.error('Erreur création Price Rule Shopify:', errorText);
        // Si ça échoue (souvent à cause de entitled_product_ids vide), on supprime le code promo de Supabase
        await supabaseAdmin.from('promo_codes').delete().eq('code', promoData.code);
        return NextResponse.json({ error: `Impossible de créer le code sur Shopify. Raison: ${errorText}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { id, is_active } = await req.json();
    const { error } = await supabaseAdmin.from('promo_codes').update({ is_active }).eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const { error } = await supabaseAdmin.from('promo_codes').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
