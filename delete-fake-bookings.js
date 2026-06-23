require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const emails = [
    'franck.belletti@ville-nice.fr',
    'ghoerle1@yahoo.fr',
    'leo.sebire@gmail.com',
    'Leo.sebire@gmail.com'
  ];

  for (const email of emails) {
    const { data: cust } = await supabaseAdmin.from('customers').select('id').ilike('email', email).maybeSingle();
    if (cust) {
      console.log(`Found customer ${email} -> ID: ${cust.id}`);
      const { data: bookings } = await supabaseAdmin.from('bookings').select('id').eq('customer_id', cust.id);
      
      for (const b of bookings || []) {
        console.log(`Deleting booking_items for booking ${b.id}`);
        await supabaseAdmin.from('booking_items').delete().eq('booking_id', b.id);
        
        console.log(`Deleting booking ${b.id}`);
        await supabaseAdmin.from('bookings').delete().eq('id', b.id);
      }
    }
  }
  console.log("Cleanup complete!");
}
main();
