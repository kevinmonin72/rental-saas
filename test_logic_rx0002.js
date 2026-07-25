require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fetch = require('node-fetch');

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
  const token = process.env.SHOPIFY_ACCESS_TOKEN.replace(/\\n/g, '').trim();
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
  let product = products.find(p => p.variants.edges.some(e => e.node.sku === sku));
  if (!product) product = products[0];
  const variants = product.variants.edges.map(e => e.node);
  const targetTitle = durationToVariantTitle(days).toLowerCase();
  let variant = variants.find(v => v.title.toLowerCase() === targetTitle || v.title.toLowerCase().replace('-', '') === targetTitle.replace('-', ''));
  if (!variant && days > 1) {
    const dayVariants = variants
      .map(v => {
        const m = v.title.toLowerCase().match(/^(\d+)\s+jours?$/);
        return m ? { ...v, days: parseInt(m[1]) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.days - b.days);
    variant = dayVariants.find(v => v.days >= days) || dayVariants[dayVariants.length - 1];
  }
  
  if (!variant) {
    if (variants.length > 0) variant = variants[0];
    else return null;
  }
  
  return { price: variant.price, title: `${product.title} — ${variant.title}` };
}

async function run() {
  const { data: bookings } = await supabaseAdmin.from('bookings').select('*, customers(*)').eq('reference', 'RX0002');
  const booking = bookings[0];
  const { data: bookingItems } = await supabaseAdmin.from('booking_items').select('*, equipment(*)').eq('booking_id', booking.id);
  
  const days = calcDurationDays(booking);
  console.log("Days:", days);

  let lineItems = [];
  if (bookingItems && bookingItems.length > 0) {
    for (const bi of bookingItems) {
      const lokSku = (bi.equipment?.reference?.startsWith('LOK-') ? bi.equipment.reference : null) || bi.equipment?.collection;
      console.log("Checking item:", bi.equipment?.reference, "lokSku:", lokSku);
      if (lokSku && lokSku.startsWith('LOK-')) {
        const shopifyVariant = await fetchShopifyVariantBySku(lokSku, days);
        console.log("Shopify Variant result:", shopifyVariant);
        if (shopifyVariant) {
          lineItems.push({
            title: `Location: ${shopifyVariant.title}`,
            price: parseFloat(shopifyVariant.price),
          });
          continue;
        }
      }
    }
  }
  console.log("Line Items:", lineItems);
}
run();
