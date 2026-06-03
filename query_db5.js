const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: items } = await supabase.from('booking_items').select('*').eq('booking_id', '21582ece-a376-4bdd-b0e8-121b2b6e2c5c');
  console.log("Items for booking 21582ece-a376-4bdd-b0e8-121b2b6e2c5c:", items);
}
check();
