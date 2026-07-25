require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('*').ilike('reference', '%RW0017%');
  console.log("Booking:", JSON.stringify(bookings[0], null, 2));
}
run();
