require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: customers } = await supabase.from('customers').select('*');
  
  const emailMap = {};
  for (const c of customers) {
     if (!c.email) continue;
     const em = c.email.toLowerCase().trim();
     if (!emailMap[em]) emailMap[em] = [];
     emailMap[em].push(c);
  }

  for (const [em, list] of Object.entries(emailMap)) {
     if (list.length > 1) {
        list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        const primary = list[0];
        console.log(`Merging ${list.length} customers for ${em} into ${primary.id}`);
        for (let i = 1; i < list.length; i++) {
           const dup = list[i];
           // Move bookings
           await supabase.from('bookings').update({ customer_id: primary.id }).eq('customer_id', dup.id);
           // Delete duplicate
           await supabase.from('customers').delete().eq('id', dup.id);
        }
     }
  }

  // Now, merge bookings that share the same customer_id AND rental_type = 'wingboost'
  const { data: bookings } = await supabase.from('bookings').select('*, booking_items(*)').eq('rental_type', 'wingboost');
  
  const cb = {};
  for (const b of bookings) {
     if (!cb[b.customer_id]) cb[b.customer_id] = [];
     cb[b.customer_id].push(b);
  }

  for (const [cid, list] of Object.entries(cb)) {
     if (list.length > 1) {
        list.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
        const primary = list[0];
        console.log(`Merging ${list.length} bookings for customer ${cid} into ${primary.id}`);

        let minStart = new Date(primary.start_date);
        let maxEnd = new Date(primary.end_date);

        for (let i = 1; i < list.length; i++) {
           const sec = list[i];
           
           const bS = new Date(sec.start_date);
           const bE = new Date(sec.end_date);
           if (bS < minStart) minStart = bS;
           if (bE > maxEnd) maxEnd = bE;

           for (const item of sec.booking_items) {
              await supabase.from('booking_items').update({
                 booking_id: primary.id,
                 start_date: sec.start_date,
                 end_date: sec.end_date
              }).eq('id', item.id);
           }
           await supabase.from('bookings').delete().eq('id', sec.id);
        }

        for (const item of primary.booking_items) {
           if (!item.start_date) {
              await supabase.from('booking_items').update({
                 start_date: primary.start_date,
                 end_date: primary.end_date
              }).eq('id', item.id);
           }
        }

        await supabase.from('bookings').update({
           start_date: minStart.toISOString().split('T')[0],
           end_date: maxEnd.toISOString().split('T')[0]
        }).eq('id', primary.id);
     } else if (list.length === 1) {
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

  console.log("Forced merge complete.");
}
run();
