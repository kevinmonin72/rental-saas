require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Fetch all wingboost bookings
  const { data: bookings, error } = await supabase
     .from('bookings')
     .select('*, booking_items(*)')
     .eq('rental_type', 'wingboost')
     .order('start_date', { ascending: true });

  if (error) {
     console.error(error);
     return;
  }

  // Group by customer_id
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
        // Keep the first booking
        const primaryBooking = custBookings[0];
        console.log(`Merging ${custBookings.length} bookings for customer ${customerId} into booking ${primaryBooking.id}`);

        let minStart = new Date(primaryBooking.start_date);
        let maxEnd = new Date(primaryBooking.end_date);

        // For all other bookings, move items
        for (let i = 1; i < custBookings.length; i++) {
           const secondaryBooking = custBookings[i];
           
           const bStart = new Date(secondaryBooking.start_date);
           const bEnd = new Date(secondaryBooking.end_date);
           
           if (bStart < minStart) minStart = bStart;
           if (bEnd > maxEnd) maxEnd = bEnd;

           // Move items
           for (const item of secondaryBooking.booking_items) {
              await supabase.from('booking_items').update({
                 booking_id: primaryBooking.id,
                 start_date: secondaryBooking.start_date, // set item specific dates
                 end_date: secondaryBooking.end_date
              }).eq('id', item.id);
           }
           
           // Delete secondary booking
           await supabase.from('bookings').delete().eq('id', secondaryBooking.id);
           deletedBookingsCount++;
        }
        
        // Update primary booking items that don't have dates yet
        for (const item of primaryBooking.booking_items) {
           if (!item.start_date || !item.end_date) {
              await supabase.from('booking_items').update({
                 start_date: primaryBooking.start_date,
                 end_date: primaryBooking.end_date
              }).eq('id', item.id);
           }
        }

        // Update primary booking overall dates
        await supabase.from('bookings').update({
           start_date: minStart.toISOString().split('T')[0],
           end_date: maxEnd.toISOString().split('T')[0]
        }).eq('id', primaryBooking.id);
        
        mergedCount++;
     } else if (custBookings.length === 1) {
        // Just ensure the items have dates
        const primaryBooking = custBookings[0];
        for (const item of primaryBooking.booking_items) {
           if (!item.start_date || !item.end_date) {
              await supabase.from('booking_items').update({
                 start_date: primaryBooking.start_date,
                 end_date: primaryBooking.end_date
              }).eq('id', item.id);
           }
        }
     }
  }

  console.log(`Done! Merged bookings for ${mergedCount} customers. Deleted ${deletedBookingsCount} duplicate bookings.`);
}

run();
