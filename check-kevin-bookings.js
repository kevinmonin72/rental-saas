require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: custs } = await supabaseAdmin.from('customers').select('id, email').ilike('email', '%kevin.monin72@gmail.com%');
  for (const cust of custs) {
    const { data: bookings } = await supabaseAdmin.from('bookings').select('id, start_date, created_at').eq('customer_id', cust.id);
    console.log(`Bookings for ${cust.email}:`, bookings);
  }
}
main();
