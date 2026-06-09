require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { data, error } = await supabaseAdmin.from('equipment').select('reference');
  const refs = data.map(d => d.reference).filter(Boolean);
  const duplicates = refs.filter((item, index) => refs.indexOf(item) !== index);
  console.log("Total duplicates found:", duplicates.length);
  if (duplicates.length > 0) {
    console.log("Some duplicates:", duplicates.slice(0, 5));
  }
}
main();
