require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const bookingId = "00000000-0000-0000-0000-000000000002";
  const equipmentId = "3156569f-3d63-476a-ab58-182b6c269147"; // LOK-PACK-KITE
  
  await supabaseAdmin.from('bookings').insert([{
    id: bookingId,
    customer_id: "13438cd8-e342-4dfa-862d-07626a42d3f3",
    start_date: "2026-06-09",
    end_date: "2026-06-16",
    status: "active",
    shopify_transfer: true,
    rental_type: "ponctuel"
  }]);

  const res = await supabaseAdmin.from('booking_items').insert([{
    id: "00000000-0000-0000-0000-000000000003",
    booking_id: bookingId,
    equipment_id: equipmentId,
    quantity: 1
  }]);
  
  console.log("Booking Item Insert result:", res);
  
  await supabaseAdmin.from('booking_items').delete().eq('id', '00000000-0000-0000-0000-000000000003');
  await supabaseAdmin.from('bookings').delete().eq('id', bookingId);
}
main();
