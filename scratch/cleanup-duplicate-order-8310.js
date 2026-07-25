require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Starting cleanup for duplicate order #8310...");

  // 1. Promo Code decrement
  const { data: promo } = await supabaseAdmin.from('promo_codes').select('id, used_count').eq('code', 'ADRIENTEST100').maybeSingle();
  if (promo) {
    console.log(`Current used_count for ADRIENTEST100: ${promo.used_count}`);
    const newCount = Math.max(0, promo.used_count - 1);
    await supabaseAdmin.from('promo_codes').update({ used_count: newCount }).eq('id', promo.id);
    console.log(`Updated used_count for ADRIENTEST100 to ${newCount}`);
  }

  // 2. Fetch duplicate customers
  const { data: custs } = await supabaseAdmin.from('customers').select('*').eq('email', 'marseille@theridery.com');
  console.log(`Found ${custs.length} customer records for marseille@theridery.com`);

  if (custs.length > 1) {
    const masterCust = custs[0];
    const dupCusts = custs.slice(1);
    console.log(`Master customer ID: ${masterCust.id}`);

    for (const dup of dupCusts) {
      console.log(`Consolidating duplicate customer ID: ${dup.id}`);
      // Re-link bookings to master customer
      const { data: updatedB } = await supabaseAdmin.from('bookings').update({ customer_id: masterCust.id }).eq('customer_id', dup.id).select();
      console.log(`Re-linked ${updatedB ? updatedB.length : 0} bookings.`);
      
      // Delete duplicate customer record
      const { error: delCustErr } = await supabaseAdmin.from('customers').delete().eq('id', dup.id);
      if (delCustErr) console.error(`Error deleting customer ${dup.id}:`, delCustErr);
      else console.log(`Deleted duplicate customer ${dup.id}`);
    }
  }

  // 3. Clean up duplicate bookings for Shopify Order 12899612066123
  const { data: bookings } = await supabaseAdmin.from('bookings').select('*').eq('shopify_order_id', '12899612066123');
  console.log(`Found ${bookings.length} bookings for order 12899612066123`);

  if (bookings.length > 1) {
    // We keep the first one and delete the rest
    const masterBooking = bookings[0];
    const dupBookings = bookings.slice(1);
    console.log(`Master booking ID: ${masterBooking.id}`);

    for (const dup of dupBookings) {
      console.log(`Deleting duplicate booking ID: ${dup.id}`);
      await supabaseAdmin.from('booking_items').delete().eq('booking_id', dup.id);
      await supabaseAdmin.from('bookings').delete().eq('id', dup.id);
      console.log(`Deleted duplicate booking ${dup.id} and its items.`);
    }
  }

  console.log("Cleanup for order #8310 complete!");
}

main();
