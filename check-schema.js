require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data, error } = await supabaseAdmin.rpc('get_table_info', { table_name: 'bookings' });
  console.log("Bookings error:", error);
  
  // Alternative: just try to insert a dummy row and print the error
  const res = await supabaseAdmin.from('bookings').insert([{
    id: "00000000-0000-0000-0000-000000000001",
    customer_id: "13438cd8-e342-4dfa-862d-07626a42d3f3",
    start_date: "2026-06-09",
    end_date: "2026-06-16",
    status: "active",
    shopify_transfer: true,
    rental_type: "ponctuel"
  }]);
  console.log("Insert result:", res);
  
  // Clean up
  await supabaseAdmin.from('bookings').delete().eq('id', '00000000-0000-0000-0000-000000000001');
}
main();
