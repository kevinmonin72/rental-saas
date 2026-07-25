require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const fetch = require('node-fetch');

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('id').eq('reference', 'RX0002');
  const id = bookings[0].id;
  
  const res = await fetch('https://rental-saas-seven.vercel.app/api/stripe/draft-invoice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bookingId: id })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}
run();
