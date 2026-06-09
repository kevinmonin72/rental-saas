require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { data, error } = await supabaseAdmin.from('equipment').upsert([
    { id: '12345678-1234-1234-1234-123456789012', reference: '07122340M', name: 'Test Duplicate Ref', category: 'Test' }
  ]);
  console.log("Upsert Error:", error);
}
main();
