require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== CUSTOMERS WITH 'LUCAS' OR 'JACQUIER' ===");
  const { data: custs } = await supabaseAdmin
    .from('customers')
    .select('*')
    .or('email.ilike.%lucas%,first_name.ilike.%lucas%,last_name.ilike.%jacquier%');
  console.log(JSON.stringify(custs, null, 2));

  console.log("=== BOOKINGS WITH SHOPIFY ORDER ID ===");
  const { data: bookings } = await supabaseAdmin
    .from('bookings')
    .select('*, customers(*)')
    .not('shopify_order_id', 'is', null);
  
  bookings.forEach(b => {
    console.log(`Booking ID: ${b.id}`);
    console.log(`  Customer: ${b.customers?.first_name} ${b.customers?.last_name} (${b.customers?.email})`);
    console.log(`  Shopify Order ID: ${b.shopify_order_id}`);
    console.log(`  Status: ${b.status}`);
    console.log(`  Created At: ${b.created_at}`);
  });
}

main();
