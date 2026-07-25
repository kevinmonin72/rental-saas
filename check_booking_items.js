require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items } = await supabase.from('booking_items').select('*').eq('booking_id', '7e68c568-b7dd-42a2-bb0d-5430165f403d');
  console.log("All Booking Items:", JSON.stringify(items, null, 2));
}
run();
