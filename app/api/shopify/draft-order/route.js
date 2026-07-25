import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

const RENTAL_TYPE_LABELS = {
  wingboost: 'Abonnement Wingboost',
  ponctuel: 'Location Ponctuelle',
  journee: 'Location 1 Journée',
  demi_matin: 'Location ½ Journée (Matin)',
  demi_aprem: 'Location ½ Journée (Après-midi)',
};

function calcDurationDays(booking) {
  const type = booking.rental_type;
  if (type === 'demi_matin' || type === 'demi_aprem') return 0.5;
  if (!booking.start_date || !booking.end_date) return 1;
  const ms = new Date(booking.end_date) - new Date(booking.start_date);
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

function durationToVariantTitle(days) {
  if (days <= 0.5) return 'Demi-journée';
  if (days === 1) return '1 jour';
  return `${days} jours`;
}

async function fetchShopifyVariantBySku(sku, days) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

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

  // Find the exact product that contains a variant with the EXACT sku
  let product = products.find(p => p.variants.edges.some(e => e.node.sku === sku));
  if (!product) {
    // Fallback to the first one if no exact match (Shopify might return weird stuff)
    product = products[0];
  }

  const variants = product.variants.edges.map(e => e.node);
  const targetTitle = durationToVariantTitle(days);
  let variant = variants.find(v => v.title === targetTitle);

  if (!variant && days > 1) {
    const dayVariants = variants
      .map(v => {
        const m = v.title.match(/^(\d+)\s+jours?$/);
        return m ? { ...v, days: parseInt(m[1]) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);

    variant = dayVariants.find(v => v.days >= days) || dayVariants[dayVariants.length - 1];
  }

  if (!variant) return null;

  const numericId = variant.id.replace('gid://shopify/ProductVariant/', '');
  return {
    variant_id: parseInt(numericId),
    price: variant.price,
    title: `${product.title} — ${variant.title}`,
  };
}

export async function POST(req) {
  try {
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId manquant' }, { status: 400 });

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!domain || !token) return NextResponse.json({ error: 'Shopify non configuré' }, { status: 500 });

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single();
    if (bookingError || !booking) return NextResponse.json({ error: 'Réservation introuvable' }, { status: 404 });

    const { data: bookingItems } = await supabaseAdmin
      .from('booking_items')
      .select('*, equipment(*)')
      .eq('booking_id', bookingId);

    const customer = booking.customers || {};
    const typeLabel = RENTAL_TYPE_LABELS[booking.rental_type] || 'Location';
    const days = calcDurationDays(booking);

    let durationStr = '';
    if (booking.start_date && booking.end_date) {
      const s = new Date(booking.start_date).toLocaleDateString('fr-FR');
      const e = new Date(booking.end_date).toLocaleDateString('fr-FR');
      if (booking.rental_type === 'demi_matin' || booking.rental_type === 'demi_aprem') {
        durationStr = `le ${s}`;
      } else if (s === e) {
        durationStr = `le ${s}`;
      } else {
        durationStr = `du ${s} au ${e}`;
      }
    }

    let lineItems = [];

    if (bookingItems && bookingItems.length > 0) {
      for (const bi of bookingItems) {
        // Catalog items have LOK- SKU in reference; physical inventory can have it in collection
        const lokSku = (bi.equipment?.reference?.startsWith('LOK-') ? bi.equipment.reference : null)
          || bi.equipment?.collection;

        if (lokSku && lokSku.startsWith('LOK-')) {
          const shopifyVariant = await fetchShopifyVariantBySku(lokSku, days);
          if (shopifyVariant) {
            lineItems.push({
              variant_id: shopifyVariant.variant_id,
              price: shopifyVariant.price, // Used for discount calculation
              quantity: 1,
              requires_shipping: false,
              taxable: true,
            });
            continue;
          }
        }

        lineItems.push({
          title: bi.equipment?.name || 'Équipement',
          price: '0.00',
          quantity: 1,
          sku: bi.equipment?.reference || '',
          requires_shipping: false,
          taxable: true,
        });
      }
    } else {
      lineItems = [{
        title: `${typeLabel} ${durationStr}`,
        price: (booking.total_amount || 0).toFixed(2),
        quantity: 1,
        requires_shipping: false,
        taxable: true,
      }];
    }

    const noteParts = [
      `Réf: ${booking.reference || bookingId}`,
      `Type: ${typeLabel}`,
      durationStr ? `Période: ${durationStr}` : '',
      booking.total_amount ? `Montant total: ${booking.total_amount}€` : '',
    ];
    
    let appliedDiscount = undefined;
    let subtotal = lineItems.reduce((acc, item) => acc + parseFloat(item.price || 0), 0);

    if (booking.notes) {
      noteParts.push(`\nNotes: ${booking.notes}`);
      const promoMatch = booking.notes.match(/\[PROMO:\s*([^\]]+)\]/i);
      if (promoMatch && promoMatch[1]) {
        const code = promoMatch[1].trim().toUpperCase();
        const { data: promoData } = await supabaseAdmin.from('promo_codes').select('*').eq('code', code).single();
        if (promoData) {
          let discountAmount = 0;
          if (promoData.discount_type === 'percentage') {
            discountAmount = subtotal * (parseFloat(promoData.discount_value) / 100);
          } else {
            discountAmount = parseFloat(promoData.discount_value);
          }
          
          if (subtotal - discountAmount <= 0) {
             return NextResponse.json({ error: 'Erreur: Le code promo rend la réservation gratuite (0€), ce qui est refusé.' }, { status: 400 });
          }

          appliedDiscount = {
            description: `Promo: ${code}`,
            value: promoData.discount_value.toString(),
            value_type: promoData.discount_type === 'percentage' ? 'percentage' : 'fixed_amount',
            amount: discountAmount.toFixed(2),
            title: code
          };
        }
      }
    }
    const note = noteParts.filter(Boolean).join('\n');

    const draftOrderPayload = {
      draft_order: {
        email: customer.email || undefined,
        line_items: lineItems,
        applied_discount: appliedDiscount,
        customer: customer.email ? { email: customer.email } : undefined,
        billing_address: customer.first_name ? {
          first_name: customer.first_name,
          last_name: customer.last_name || '',
          email: customer.email || '',
          address1: customer.address || '',
          city: 'Marseille',
          country: 'FR',
        } : undefined,
        note,
        tags: `location,rental-saas,${booking.rental_type || ''}`,
        use_customer_default_address: false,
      }
    };

    const res = await fetch(`https://${domain}/admin/api/2024-04/draft_orders.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify(draftOrderPayload),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Shopify draft order error:', err);
      return NextResponse.json({ error: 'Erreur Shopify: ' + err }, { status: 500 });
    }

    const { draft_order } = await res.json();
    const storeName = domain.replace('.myshopify.com', '');
    const admin_url = `https://admin.shopify.com/store/${storeName}/draft_orders/${draft_order.id}`;

    // If a discount was successfully applied, increment the used_count
    if (appliedDiscount && appliedDiscount.title) {
      const code = appliedDiscount.title;
      const { data: promoData } = await supabaseAdmin.from('promo_codes').select('id, used_count').eq('code', code).single();
      if (promoData) {
        await supabaseAdmin.from('promo_codes').update({ used_count: (promoData.used_count || 0) + 1 }).eq('id', promoData.id);
      }
    }

    return NextResponse.json({
      id: draft_order.id,
      admin_url,
      invoice_url: draft_order.invoice_url,
    });
  } catch (err) {
    console.error('Draft order error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
