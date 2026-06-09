require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  const { data: bData, error: bError } = await supabaseAdmin.from('bookings').select('*').limit(20);
  const { data: cData, error: cError } = await supabaseAdmin.from('customers').select('*').limit(20);
  const { data: eqData, error: eqError } = await supabaseAdmin.from('equipment').select('*').limit(20);
  
  console.log("Bookings match 0606:", bData ? bData.filter(b => JSON.stringify(b).includes('0606')) : bError);
  console.log("Customers match 0606:", cData ? cData.filter(c => JSON.stringify(c).includes('0606')) : cError);
  console.log("Equipment match 0606:", eqData ? eqData.filter(eq => JSON.stringify(eq).includes('0606')) : eqError);
}
main();
