import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.prod.vercel' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: bookings } = await supabaseAdmin.from('bookings').select('id, status').limit(5);
  console.log("Bookings:", bookings.map(b => b.id));
  
  if (bookings.length > 0) {
    const bookingId = bookings[0].id;
    const { data: bookingItems } = await supabaseAdmin.from('booking_items').select('*, equipment(*)').eq('booking_id', bookingId);
    console.log("Booking items:", bookingItems.map(bi => ({ ref: bi.equipment?.reference, col: bi.equipment?.collection })));
  }
}
test();
