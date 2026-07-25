require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');

const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBooking() {
  const { data: bookings } = await client
    .from('bookings')
    .select('id, reference')
    .ilike('reference', '%0017%');

  console.log('Bookings:', bookings);
}

checkBooking();
