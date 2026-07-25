require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkKevin() {
  const { data: bookings } = await client
    .from('bookings')
    .select('id, reference, customers(first_name, last_name)')
    .eq('reference', 'RW0017');

  console.log(JSON.stringify(bookings, null, 2));

  const { data: items } = await client
    .from('booking_items')
    .select('*, equipment (name, reference)')
    .eq('booking_id', bookings[0].id);
    
  console.log(JSON.stringify(items, null, 2));
}

checkKevin();
