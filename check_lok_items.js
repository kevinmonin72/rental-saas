require('dotenv').config({ path: '.env.prod.vercel' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: items } = await supabase.from('booking_items').select('*, equipment(reference, name, collection)').not('equipment_id', 'is', null);
  
  const lokItems = items.filter(i => {
    return (i.equipment?.reference && i.equipment.reference.startsWith('LOK-')) || 
           (i.equipment?.collection && i.equipment.collection.startsWith('LOK-'));
  });
  
  console.log("Found LOK items in bookings:", lokItems.length);
  if (lokItems.length > 0) {
    console.log(JSON.stringify(lokItems.slice(0, 5), null, 2));
  }
}
run();
