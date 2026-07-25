require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items } = await supabase.from('booking_items').select('*, bookings(*)').not('equipment_id', 'is', null);
  
  // Need to fetch equipment data manually to filter, or we could have done a join
  const { data: allEquip } = await supabase.from('equipment').select('*');
  const equipMap = {};
  allEquip.forEach(e => equipMap[e.id] = e);
  
  const twintipItems = items.filter(i => {
    const e = equipMap[i.equipment_id];
    if (!e) return false;
    return e.reference === 'LOK-BOARD-TWINTIP' || e.collection === 'LOK-BOARD-TWINTIP';
  });
  
  console.log("Found bookings with LOK-BOARD-TWINTIP:", twintipItems.length);
  for (const i of twintipItems) {
    console.log("Booking:", i.bookings.reference, "Dates:", i.bookings.start_date, i.bookings.end_date, "Type:", i.bookings.rental_type);
  }
}
run();
