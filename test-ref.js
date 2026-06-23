import { supabaseAdmin } from './lib/supabase-admin.js';

async function checkRef() {
  const { data: bookings, error } = await supabaseAdmin.from('bookings').select('*, customers!inner(*)');
  if (error) console.error(error);
  else {
    const match = bookings.filter(b => b.reference && b.reference.toUpperCase().includes('0E81B34F'));
    console.log(JSON.stringify(match, null, 2));
  }
}
checkRef();
