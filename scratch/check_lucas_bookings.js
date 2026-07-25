require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== CUSTOMERS FOR lucas.jacquier@theridery.com ===");
  const { data: custs } = await supabaseAdmin
    .from('customers')
    .select('id, first_name, last_name, email, created_at')
    .eq('email', 'lucas.jacquier@theridery.com');
  console.log(custs);

  const custIds = custs.map(c => c.id);

  console.log("\n=== BOOKINGS LINKED TO THESE CUSTOMER IDS ===");
  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select('*, customers(email, first_name, last_name)')
    .in('customer_id', custIds);

  if (error) {
    console.error(error);
  } else {
    console.log(bookings);
  }
}

main();
