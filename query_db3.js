const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: bookings } = await supabase.from('bookings').select('*').in('id', ['21582ece-a376-4bdd-b0e8-121b2b6e2c5c', '2f44020a-f032-4e8d-b97a-e03a57a08942', 'e86d00dd-e348-47b0-8f46-8f6ab904a64b']);
  console.log("Bookings:", bookings);
}
check();
