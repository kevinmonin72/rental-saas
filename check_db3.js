require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBooking() {
  const { data: items } = await client
    .from('booking_items')
    .select('*, equipment (*)')
    .eq('booking_id', '9452337c-0910-4f40-8aa2-32f9542a6580');

  console.log(JSON.stringify(items, null, 2));
}

checkBooking();
