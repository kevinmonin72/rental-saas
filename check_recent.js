require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('id, reference').order('created_at', { ascending: false }).limit(5);
  for (const b of bookings) {
    const { data: items } = await supabase.from('booking_items').select('*, equipment(reference)').eq('booking_id', b.id);
    console.log(`Booking ${b.reference} items:`, items.map(i => i.equipment?.reference));
  }
}
run();
