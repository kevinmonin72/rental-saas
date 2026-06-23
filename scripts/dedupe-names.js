require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: customers } = await supabase.from('customers').select('*');
  
  const nameMap = {};
  for (const c of customers) {
     const key = (c.first_name + ' ' + c.last_name).toLowerCase().trim();
     if (!key) continue;
     if (!nameMap[key]) nameMap[key] = [];
     nameMap[key].push(c);
  }

  let dupCount = 0;
  for (const [key, list] of Object.entries(nameMap)) {
     if (list.length > 1) {
        // Prefer the one with most info
        list.sort((a, b) => {
           const aScore = (a.email ? 1 : 0) + (a.phone ? 1 : 0);
           const bScore = (b.email ? 1 : 0) + (b.phone ? 1 : 0);
           if (aScore !== bScore) return bScore - aScore; // highest score first
           return new Date(a.created_at) - new Date(b.created_at); // then oldest
        });
        const primary = list[0];
        
        for (let i = 1; i < list.length; i++) {
           const dup = list[i];
           await supabase.from('bookings').update({ customer_id: primary.id }).eq('customer_id', dup.id);
           await supabase.from('customers').delete().eq('id', dup.id);
           dupCount++;
        }
     }
  }
  console.log(`Deleted ${dupCount} duplicate customers by name.`);

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
