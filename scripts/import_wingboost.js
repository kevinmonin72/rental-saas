const fs = require('fs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const lines = fs.readFileSync('/Users/kevinmonin/rental-saas/wingboost_data.tsv', 'utf-8').split('\n');

async function run() {
   // Skip header
   const orders = {};

   for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split('\t');
      
      const orderId = cols[0];
      const email = cols[1]?.trim().toLowerCase();
      const createdAt = cols[15]?.trim();
      const lineItemName = cols[17]?.trim() || '';
      const sku = cols[20]?.trim();
      const billingName = cols[24]?.trim();
      const phone = cols[33]?.trim() || cols[43]?.trim() || cols[72]?.trim();

      if (!orderId) continue;

      if (!orders[orderId]) {
         orders[orderId] = {
            email,
            billingName,
            phone,
            createdAt,
            durationMonths: 1, // default
            items: []
         };
      }

      // If this row has email, billingName, update the order
      if (email && email.includes('@')) orders[orderId].email = email;
      if (billingName) orders[orderId].billingName = billingName;
      if (phone) orders[orderId].phone = phone;
      if (createdAt && createdAt !== '') orders[orderId].createdAt = createdAt;

      // Check duration
      const monthMatch = lineItemName.match(/(\d+)\s*mois/i);
      if (monthMatch) {
         const m = parseInt(monthMatch[1]);
         if (m > orders[orderId].durationMonths) {
            orders[orderId].durationMonths = m;
         }
      }

      if (sku) {
         orders[orderId].items.push({ name: lineItemName, sku });
      }
   }

   let bookingsCreated = 0;

   for (const orderId of Object.keys(orders)) {
      const order = orders[orderId];
      if (!order.email || !order.createdAt) continue;
      if (order.items.length === 0) continue;

      // Filter by date: since 01/01/2026? 
      // User said "depuis fin 2025 prend tout ... depuis le 01/01/2026"
      // We will just process all that have items
      const startDate = new Date(order.createdAt);
      if (isNaN(startDate.getTime())) continue;
      
      // Calculate end date
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + order.durationMonths);

      // Find or create customer
      let { data: customer } = await supabaseAdmin.from('customers').select('*').eq('email', order.email).maybeSingle();
      if (!customer) {
         let firstName = '';
         let lastName = '';
         if (order.billingName) {
            const parts = order.billingName.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
         }
         const { data: createdC } = await supabaseAdmin.from('customers').insert([{
            id: crypto.randomUUID(),
            email: order.email,
            first_name: firstName,
            last_name: lastName,
            phone: order.phone || ''
         }]).select().single();
         customer = createdC;
      }

      if (!customer) continue;

      // Find existing booking for this order/date to avoid duplicates
      // We don't have order_id in bookings, so we check customer + start_date
      let { data: existingBooking } = await supabaseAdmin.from('bookings')
         .select('*')
         .eq('customer_id', customer.id)
         .eq('start_date', startDate.toISOString().split('T')[0])
         .maybeSingle();

      let booking = existingBooking;

      if (!booking) {
         const { data: createdB } = await supabaseAdmin.from('bookings').insert([{
            id: crypto.randomUUID(),
            customer_id: customer.id,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
            status: 'active'
         }]).select().single();
         booking = createdB;
         bookingsCreated++;
      }

      if (!booking) continue;

      // Insert equipment
      for (const item of order.items) {
         // Find equipment by ref
         const { data: equipment } = await supabaseAdmin.from('equipment').select('*').eq('reference', item.sku).maybeSingle();
         
         if (equipment) {
            // check if already linked
            const { data: existingItem } = await supabaseAdmin.from('booking_items')
               .select('*')
               .eq('booking_id', booking.id)
               .eq('equipment_id', equipment.id)
               .maybeSingle();
            
            if (!existingItem) {
               await supabaseAdmin.from('booking_items').insert([{
                  id: crypto.randomUUID(),
                  booking_id: booking.id,
                  equipment_id: equipment.id,
                  quantity: 1
               }]);
            }
         } else {
            // Equipment not found, optionally create it?
            // "met les equipement via les ref que tu trouve"
            // I'll create a generic equipment record if it doesn't exist, to not lose data.
            const newEqId = crypto.randomUUID();
            await supabaseAdmin.from('equipment').insert([{
               id: newEqId,
               reference: item.sku,
               name: item.name,
               category: 'Wing'
            }]);
            await supabaseAdmin.from('booking_items').insert([{
               id: crypto.randomUUID(),
               booking_id: booking.id,
               equipment_id: newEqId,
               quantity: 1
            }]);
         }
      }
   }

   console.log(`Wingboost import done! Created/Processed bookings: ${bookingsCreated}`);
}

run().catch(console.error);
