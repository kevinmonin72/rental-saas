require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Get all wingboost bookings
  const { data: bookings } = await supabase.from('bookings').select('*, customer:customers(*), booking_items(*)').eq('rental_type', 'wingboost');
  
  if (!bookings || bookings.length === 0) {
     console.log("No wingboost bookings found");
     return;
  }

  // Group bookings by email
  const emailMap = {};
  for (const b of bookings) {
     if (!b.customer || !b.customer.email) continue;
     const email = b.customer.email.toLowerCase().trim();
     if (!emailMap[email]) emailMap[email] = [];
     emailMap[email].push(b);
  }

  let mergedCount = 0;
  for (const [email, list] of Object.entries(emailMap)) {
     if (list.length > 1) {
        // Sort bookings by start date
        list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        
        const primaryBooking = list[0];
        const primaryCustomer = primaryBooking.customer;

        console.log(`Merging ${list.length} bookings for ${email} into booking ${primaryBooking.id} (Customer: ${primaryCustomer.id})`);

        let minStart = new Date(primaryBooking.start_date);
        let maxEnd = new Date(primaryBooking.end_date);

        for (let i = 1; i < list.length; i++) {
           const secBooking = list[i];
           
           const bS = new Date(secBooking.start_date);
           const bE = new Date(secBooking.end_date);
           if (bS < minStart) minStart = bS;
           if (bE > maxEnd) maxEnd = bE;

           // Move items
           for (const item of secBooking.booking_items) {
              await supabase.from('booking_items').update({
                 booking_id: primaryBooking.id,
                 start_date: secBooking.start_date,
                 end_date: secBooking.end_date
              }).eq('id', item.id);
           }

           // Delete secondary booking
           await supabase.from('bookings').delete().eq('id', secBooking.id);

           // If the customer id is different, delete the duplicate customer too
           if (secBooking.customer.id !== primaryCustomer.id) {
              // Delete the duplicate customer, assuming they don't have other non-wingboost bookings! 
              // Wait, they might have. We should move all their bookings to primaryCustomer first.
              await supabase.from('bookings').update({ customer_id: primaryCustomer.id }).eq('customer_id', secBooking.customer.id);
              await supabase.from('customers').delete().eq('id', secBooking.customer.id);
           }
        }

        // Make sure all items in primary booking have dates
        for (const item of primaryBooking.booking_items) {
           if (!item.start_date) {
              await supabase.from('booking_items').update({
                 start_date: primaryBooking.start_date,
                 end_date: primaryBooking.end_date
              }).eq('id', item.id);
           }
        }

        // Update primary booking date
        await supabase.from('bookings').update({
           start_date: minStart.toISOString().split('T')[0],
           end_date: maxEnd.toISOString().split('T')[0]
        }).eq('id', primaryBooking.id);
        
        mergedCount++;
     } else if (list.length === 1) {
        // Just set dates on items
        const primary = list[0];
        for (const item of primary.booking_items) {
           if (!item.start_date) {
              await supabase.from('booking_items').update({
                 start_date: primary.start_date,
                 end_date: primary.end_date
              }).eq('id', item.id);
           }
        }
     }
  }

  console.log(`Merged ${mergedCount} customers' bookings.`);
}
run();
