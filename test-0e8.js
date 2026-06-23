import { supabaseAdmin } from './lib/supabase-admin.js';

async function checkId() {
  const { data: bookings, error } = await supabaseAdmin.from('bookings').select('*, customers!inner(*)');
  if (error) console.error(error);
  else {
    const match = bookings.filter(b => b.id.startsWith('0e81b34f'));
    console.log(JSON.stringify(match, null, 2));
  }
}
checkId();
