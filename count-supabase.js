require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { count, error } = await supabaseAdmin.from('equipment').select('*', { count: 'exact', head: true });
  console.log("Total equipment in Supabase:", count, error);
}
main();
