require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEq() {
  const { data, error } = await supabase.from('equipment').select('*').limit(10);
  console.log(data);
  
  const { count } = await supabase.from('equipment').select('*', { count: 'exact', head: true });
  console.log('Total count:', count);
}

checkEq();
