require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: bookings } = await supabaseAdmin.from('bookings').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent Bookings:", bookings);
}
main();
