const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: eq } = await supabase.from('equipment').select('*').eq('id', '7fee53b0-b333-42a0-8108-527adf71f218');
  console.log("Equipment:", eq);
}
check();
