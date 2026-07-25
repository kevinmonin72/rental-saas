require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: booking } = await supabase.from('bookings').select('*').eq('id', '3f6d4fc0-c7cd-44bb-b37d-dfe35d89feca');
  console.log("Booking:", JSON.stringify(booking, null, 2));
}
run();
