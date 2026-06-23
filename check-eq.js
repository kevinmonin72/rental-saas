require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data } = await supabaseAdmin.from('equipment').select('*').eq('reference', 'LOK-PACK-KITE');
  console.log(JSON.stringify(data, null, 2));
}
main();
