require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('id, reference').ilike('reference', '%RW0017%');
  if (bookings && bookings.length > 0) {
    const { data: items } = await supabase.from('booking_items').select('*, equipment(reference, name, collection)').eq('booking_id', bookings[0].id);
    console.log("Booking Items:", JSON.stringify(items, null, 2));
  } else {
    console.log("Booking not found");
  }
}
run();
