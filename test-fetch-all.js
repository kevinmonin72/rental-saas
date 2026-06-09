require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { data: page1, error: err1 } = await supabaseAdmin.from('equipment').select('reference').range(0, 999);
  console.log("Page 1 length:", page1 ? page1.length : err1);
  const { data: page2, error: err2 } = await supabaseAdmin.from('equipment').select('reference').range(1000, 1999);
  console.log("Page 2 length:", page2 ? page2.length : err2);
}
main();
