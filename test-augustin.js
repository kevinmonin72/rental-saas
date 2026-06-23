import { supabaseAdmin } from './lib/supabase-admin.js';

async function checkAugustin() {
  const { data: bookings, error } = await supabaseAdmin.from('bookings').select('*, customers!inner(*)').ilike('customers.first_name', 'Augustin');
  if (error) console.error(error);
  else console.log(JSON.stringify(bookings, null, 2));
}
checkAugustin();
