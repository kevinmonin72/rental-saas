require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase.from('bookings').select('id, rental_type, start_date').gte('created_at', new Date(Date.now() - 3600000).toISOString()); // last hour
  if (data) {
     console.log('Bookings created recently:', data.length);
     for (const b of data) {
        if (!b.rental_type || b.rental_type !== 'wingboost') {
           await supabase.from('bookings').update({ rental_type: 'wingboost' }).eq('id', b.id);
           console.log(`Updated booking ${b.id} to wingboost`);
        }
     }
  } else {
     console.log('Error', error);
  }
}
run();
