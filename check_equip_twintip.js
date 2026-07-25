require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: equip } = await supabase.from('equipment').select('*').or('reference.eq.LOK-BOARD-TWINTIP,collection.eq.LOK-BOARD-TWINTIP');
  console.log("Equipment:", equip);
}
run();
