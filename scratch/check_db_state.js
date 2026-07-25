require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== PROMO CODES ===");
  const { data: promos } = await supabaseAdmin.from('promo_codes').select('*').eq('code', 'LUCASTEST100');
  console.log(JSON.stringify(promos, null, 2));

  console.log("=== CUSTOMERS ===");
  const { data: custs } = await supabaseAdmin.from('customers').select('*').eq('email', 'lucas.jacquier@theridery.com');
  console.log(JSON.stringify(custs, null, 2));

  if (custs && custs.length > 0) {
    console.log("=== BOOKINGS FOR CUSTOMERS ===");
    for (const c of custs) {
      const { data: bookings } = await supabaseAdmin
        .from('bookings')
        .select('*, booking_items(*, equipment(*))')
        .eq('customer_id', c.id);
      
      console.log(`Customer ${c.first_name} ${c.last_name} (${c.id}):`);
      console.log(JSON.stringify(bookings, null, 2));
      console.log("-----------------------------------------");
    }
  }
}

main();
