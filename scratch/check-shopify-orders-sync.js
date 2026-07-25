require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders.json?status=any&limit=10`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN } });
  const data = await res.json();
  
  console.log("Recent Shopify Orders:");
  for (const order of data.orders) {
    const email = order.customer?.email || order.email;
    const { data: bookings } = await supabaseAdmin.from('bookings').select('id, start_date, created_at, status').eq('shopify_order_id', String(order.id));
    console.log(`Order Name: ${order.name} | ID: ${order.id} | Email: ${email} | Paid Status: ${order.financial_status} | Created: ${order.created_at} | Bookings synced:`, bookings);
  }
}
main();
