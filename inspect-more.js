require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { data } = await supabaseAdmin.from('equipment').select('reference').limit(5000);
  
  // Find which ones match a pattern or are just random UUIDs?
  const isShopifyId = /^\d+$/.test(data[0].reference);
  let justNumbers = 0;
  let hasLetters = 0;
  for (const d of data) {
    if (/^\d+$/.test(d.reference)) justNumbers++;
    else hasLetters++;
  }
  console.log(`Just numbers: ${justNumbers}, Has letters: ${hasLetters}`);
  console.log("Sample just numbers:", data.filter(d => /^\d+$/.test(d.reference)).slice(0, 5).map(d => d.reference).join(', '));
  console.log("Sample has letters:", data.filter(d => !/^\d+$/.test(d.reference)).slice(0, 5).map(d => d.reference).join(', '));
}
main();
