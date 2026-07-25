require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabaseAdmin.from('bookings').select('*').eq('reference', 'RX0002');
  console.log("RX0002 dates:", bookings[0].start_date, bookings[0].end_date, bookings[0].rental_type);
}
run();
