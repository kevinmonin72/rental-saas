const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: items } = await supabase.from('booking_items').select('*').eq('equipment_id', '7fee53b0-b333-42a0-8108-527adf71f218');
  console.log("Items for Housse Prolimit:", items);
  const { data: bookings } = await supabase.from('bookings').select('*').in('id', items.map(i => i.booking_id));
  console.log("Bookings:", bookings);
}
check();
