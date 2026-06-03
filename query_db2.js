const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: items } = await supabase.from('booking_items').select('*').eq('equipment_id', 'e758dd84-aadb-4c0a-85c6-221cabc1ce71');
  console.log("Items for e758dd84-aadb-4c0a-85c6-221cabc1ce71:", items);
}
check();
