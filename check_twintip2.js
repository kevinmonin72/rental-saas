require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: bookings } = await supabase.from('bookings').select('*');
  const matched = bookings.filter(b => 
    b.rental_type?.includes('TWINTIP') || 
    b.rental_type?.includes('LOK') ||
    b.notes?.includes('TWINTIP')
  );
  console.log("Bookings:", matched);
}
run();
