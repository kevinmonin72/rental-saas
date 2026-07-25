require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: bookings, error } = await supabaseAdmin.from('bookings').select('*, customers(first_name, last_name, email)').order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  console.log(`Total bookings found: ${bookings.length}`);
  bookings.forEach(b => {
    console.log(`ID: ${b.id} | Name: ${b.customers?.first_name} ${b.customers?.last_name} (${b.customers?.email}) | Created: ${b.created_at} | Start: ${b.start_date} | Type: ${b.rental_type} | Order ID: ${b.shopify_order_id} | Status: ${b.status}`);
  });
}
main();
