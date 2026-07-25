require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data, error } = await client.from('bookings').select('*').limit(1);
  console.log(Object.keys(data[0]));
}
check();
