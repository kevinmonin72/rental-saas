require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('id, reference, rental_type').eq('rental_type', 'ponctuel').order('created_at', { ascending: false }).limit(3);
  console.log("Bookings:", JSON.stringify(bookings, null, 2));
  
  if (bookings && bookings.length > 0) {
    for (const b of bookings) {
      const { data: items } = await supabase.from('booking_items').select('*, equipment(reference, name, collection)').eq('booking_id', b.id);
      console.log(`Items for ${b.reference}:`, JSON.stringify(items, null, 2));
    }
  }
}
run();
