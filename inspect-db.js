require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { count, error } = await supabaseAdmin.from('equipment').select('*', { count: 'exact', head: true });
  console.log("Total equipment remaining:", count);
  const { data } = await supabaseAdmin.from('equipment').select('id, reference').limit(10);
  console.log("Sample references:", data.map(d => d.reference).join(', '));
  
  // Count items with NULL reference
  const { count: nullCount } = await supabaseAdmin.from('equipment').select('*', { count: 'exact', head: true }).is('reference', null);
  console.log("Total equipment with NULL reference:", nullCount);
}
main();
