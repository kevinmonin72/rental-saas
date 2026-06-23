import { supabaseAdmin } from './lib/supabase-admin.js';

async function checkAugustin() {
  const { data: customers, error } = await supabaseAdmin.from('customers').select('*').ilike('first_name', 'Augustin');
  if (error) console.error(error);
  else console.log(JSON.stringify(customers, null, 2));
}
checkAugustin();
