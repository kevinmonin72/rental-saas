require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: custs } = await supabaseAdmin.from('customers').select('id, email, first_name, last_name').ilike('email', '%ghoerle%');
  console.log("Found customers matching 'ghoerle':", custs);
  
  if (custs && custs.length > 0) {
    for (const cust of custs) {
      const { data: bookings } = await supabaseAdmin.from('bookings').select('id').eq('customer_id', cust.id);
      console.log(`Found bookings for ${cust.email}:`, bookings);
      
      for (const b of bookings || []) {
        console.log(`Deleting booking_items for booking ${b.id}`);
        await supabaseAdmin.from('booking_items').delete().eq('booking_id', b.id);
        
        console.log(`Deleting booking ${b.id}`);
        await supabaseAdmin.from('bookings').delete().eq('id', b.id);
      }
    }
  }
}
main();
