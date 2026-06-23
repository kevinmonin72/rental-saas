require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const idsToDelete = [
    '0c41840a-47f1-45e7-8ed1-feb0547a70eb',
    'a5c95929-df5a-4d4a-8eb7-e7b03bd8db7f'
  ];
  for (const id of idsToDelete) {
    await supabaseAdmin.from('booking_items').delete().eq('booking_id', id);
    await supabaseAdmin.from('bookings').delete().eq('id', id);
    console.log("Deleted", id);
  }
}
main();
