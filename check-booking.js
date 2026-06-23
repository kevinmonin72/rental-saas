require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: cust } = await supabaseAdmin.from('customers').select('*').eq('email', 'kevin.monin72@gmail.com');
  console.log("Customer:", cust);
  if (cust && cust.length > 0) {
    const { data: bookings } = await supabaseAdmin.from('bookings').select('*').eq('customer_id', cust[0].id).order('created_at', { ascending: false }).limit(5);
    console.log("Bookings:", bookings);
  }
}
main();
