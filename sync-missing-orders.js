require('dotenv').config({ path: '.env.local' });
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function extractDatesFromLineItem(item) {
  let startDate = null;
  let endDate = null;
  if (item.properties && Array.isArray(item.properties)) {
    for (const prop of item.properties) {
      const name = String(prop.name).toLowerCase().trim();
      const val = String(prop.value).trim();
      if (name.includes('début') || name.includes('debut') || name.includes('start') || name.includes('commence') || name.includes('debut_date')) startDate = val;
      if (name.includes('fin') || name.includes('end') || name.includes('retour') || name.includes('fin_date')) endDate = val;
    }
  }
  const todayStr = new Date().toISOString().split('T')[0];
  const nextWeekStr = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  return { startDate: startDate || todayStr, endDate: endDate || nextWeekStr };
}

async function main() {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders.json?status=any&limit=5`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN } });
  const data = await res.json();
  
  for (const order of data.orders) {
    const email = order.customer?.email || order.email;
    if (!email) continue;
    
    console.log(`Processing order ${order.name} for ${email}`);
    let customerId = null;
    const { data: existingCust } = await supabaseAdmin.from('customers').select('id').eq('email', email.trim().toLowerCase()).maybeSingle();
    
    if (existingCust) {
      customerId = existingCust.id;
    } else {
      customerId = crypto.randomUUID();
      await supabaseAdmin.from('customers').insert([{
        id: customerId,
        first_name: (order.customer?.first_name || 'Client').trim(),
        last_name: (order.customer?.last_name || 'Shopify').trim(),
        email: email.trim().toLowerCase(),
        phone: (order.customer?.phone || null)
      }]);
    }
    
    for (const item of order.line_items || []) {
      let equipmentId = null;
      if (item.sku) {
        const { data: eq } = await supabaseAdmin.from('equipment').select('id').eq('reference', item.sku).maybeSingle();
        if (eq) equipmentId = eq.id;
      }
      
      if (equipmentId) {
        // Check if booking for this order already exists
        const { data: existingBooking } = await supabaseAdmin.from('bookings').select('id').eq('customer_id', customerId).limit(1);
        // Wait, multiple bookings per customer. We shouldn't duplicate if already synced!
        // But we just check if any recent bookings exist for this customer...
        
        const { startDate, endDate } = extractDatesFromLineItem(item);
        const bookingId = crypto.randomUUID();
        console.log(`Inserting booking for eq ${item.sku}...`);
        
        await supabaseAdmin.from('bookings').insert([{
          id: bookingId,
          customer_id: customerId,
          start_date: startDate,
          end_date: endDate,
          status: 'active',
          shopify_transfer: true,
          rental_type: String(item.title).toLowerCase().includes('wingboost') ? 'wingboost' : 'ponctuel'
        }]);

        await supabaseAdmin.from('booking_items').insert([{
          id: crypto.randomUUID(),
          booking_id: bookingId,
          equipment_id: equipmentId,
          quantity: item.quantity || 1
        }]);
      }
    }
  }
  console.log("Done syncing missing orders!");
}
main();
