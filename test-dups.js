import { supabaseAdmin } from './lib/supabase-admin.js';

async function checkDups() {
  const { data: bookings, error } = await supabaseAdmin.from('bookings').select('*, customers(first_name, last_name, email)');
  if (error) {
    console.error(error);
    return;
  }
  const map = {};
  for (const b of bookings) {
    if (b.rental_type !== 'wingboost') continue;
    const key = `${b.customer_id}`;
    if (!map[key]) map[key] = [];
    map[key].push(b);
  }

  for (const [key, list] of Object.entries(map)) {
    if (list.length > 1) {
      console.log(`Duplicate Wingboost found for ${list[0].customers.first_name} ${list[0].customers.last_name}:`);
      list.forEach(item => {
        console.log(`- ID: ${item.id}, Shopify Order: ${item.shopify_order_id}, Status: ${item.status}, Start: ${item.start_date}`);
      });
    }
  }
}

checkDups();
