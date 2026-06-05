import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const [eq, book, items] = await Promise.all([
    supabase.from('equipment').select('*').limit(1),
    supabase.from('bookings').select('*').limit(1),
    supabase.from('booking_items').select('*').limit(1)
  ]);

  console.log('Equipment error:', eq.error);
  console.log('Bookings error:', book.error);
  console.log('Booking items error:', items.error);
}

test();
