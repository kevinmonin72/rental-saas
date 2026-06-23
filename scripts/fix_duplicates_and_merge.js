require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Fetching customers...");
  const { data: customers } = await supabase.from('customers').select('*');
  
  const emailMap = {};
  for (const c of customers) {
     const email = c.email ? c.email.toLowerCase() : null;
     if (!email) continue;
     if (!emailMap[email]) emailMap[email] = [];
     emailMap[email].push(c);
  }

  let dupCount = 0;
  for (const [email, list] of Object.entries(emailMap)) {
     if (list.length > 1) {
        // Sort by created_at
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const primary = list[0];
        
        for (let i = 1; i < list.length; i++) {
           const dup = list[i];
           // Move bookings
           await supabase.from('bookings').update({ customer_id: primary.id }).eq('customer_id', dup.id);
           // Delete duplicate
           await supabase.from('customers').delete().eq('id', dup.id);
           dupCount++;
        }
     }
  }
  console.log(`Deleted ${dupCount} duplicate customers.`);

  // Now merge bookings for each customer
  console.log("Merging bookings...");
  const { data: bookings } = await supabase
     .from('bookings')
     .select('*, booking_items(*)')
     .eq('rental_type', 'wingboost')
     .order('start_date', { ascending: true });

  const customerBookings = {};
  for (const b of bookings) {
     if (!customerBookings[b.customer_id]) {
        customerBookings[b.customer_id] = [];
     }
     customerBookings[b.customer_id].push(b);
  }

  let mergedCount = 0;
  let deletedBookingsCount = 0;

  for (const [customerId, custBookings] of Object.entries(customerBookings)) {
     if (custBookings.length > 1) {
        // Sort by start_date to make the earliest the primary
        custBookings.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const primaryBooking = custBookings[0];
        console.log(`Customer ${customerId} has ${custBookings.length} bookings. Merging into ${primaryBooking.id}`);

        let minStart = new Date(primaryBooking.start_date);
        let maxEnd = new Date(primaryBooking.end_date);

        for (let i = 1; i < custBookings.length; i++) {
           const secondaryBooking = custBookings[i];
           
           const bStart = new Date(secondaryBooking.start_date);
           const bEnd = new Date(secondaryBooking.end_date);
           
           if (bStart < minStart) minStart = bStart;
           if (bEnd > maxEnd) maxEnd = bEnd;

           for (const item of secondaryBooking.booking_items) {
              await supabase.from('booking_items').update({
                 booking_id: primaryBooking.id,
                 start_date: secondaryBooking.start_date,
                 end_date: secondaryBooking.end_date
              }).eq('id', item.id);
           }
           
           await supabase.from('bookings').delete().eq('id', secondaryBooking.id);
           deletedBookingsCount++;
        }
        
        for (const item of primaryBooking.booking_items) {
           if (!item.start_date || !item.end_date) {
              await supabase.from('booking_items').update({
                 start_date: primaryBooking.start_date,
                 end_date: primaryBooking.end_date
              }).eq('id', item.id);
           }
        }

        await supabase.from('bookings').update({
           start_date: minStart.toISOString().split('T')[0],
           end_date: maxEnd.toISOString().split('T')[0]
        }).eq('id', primaryBooking.id);
        
        mergedCount++;
     }
  }

  console.log(`Done! Merged bookings for ${mergedCount} customers. Deleted ${deletedBookingsCount} duplicate bookings.`);
}

run().catch(console.error);
