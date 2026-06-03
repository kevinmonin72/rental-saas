const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: bookings, error: bErr } = await supabase.from('bookings').select('*');
  const { data: items, error: iErr } = await supabase.from('booking_items').select('*');
  console.log("Bookings count:", bookings.length);
  console.log("Items count:", items.length);
  
  const activeBookings = bookings.filter(b => b.status === 'active');
  console.log("Active bookings:", activeBookings.length);
  
  // check for duplicates
  const eqCount = {};
  for (const b of activeBookings) {
    const bItems = items.filter(i => i.booking_id === b.id);
    for (const item of bItems) {
      eqCount[item.equipment_id] = (eqCount[item.equipment_id] || 0) + item.quantity;
    }
  }
  console.log("Equipment usage:", eqCount);
}
check();
