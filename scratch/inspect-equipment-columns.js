require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('equipment').select('reference, name, brand, quantity').like('reference', 'LOK-%');
  if (data) {
    console.log('Total LOK- items found:', data.length);
    console.log('List of found items:');
    data.forEach(item => {
      console.log(`- Ref: ${item.reference} | Name: ${item.name} | Brand (image): ${item.brand} | Qty: ${item.quantity}`);
    });
  } else {
    console.error('Error:', error);
  }
}
run();
