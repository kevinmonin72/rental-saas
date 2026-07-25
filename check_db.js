require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBooking() {
  const { data: booking } = await client
    .from('bookings')
    .select('id, reference')
    .eq('reference', 'RW0017')
    .single();

  if (!booking) return console.log('Booking not found');

  const { data: items } = await client
    .from('booking_items')
    .select('quantity, equipment (reference, name)')
    .eq('booking_id', booking.id);
  
  console.log(JSON.stringify(items, null, 2));
}

checkBooking();
