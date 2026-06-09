require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function main() {
  const { data, error } = await supabase.from('equipment').select('*').order('created_at', { ascending: false }).limit(5);
  console.log("Recent equipment in Supabase:", data);
}
main();
