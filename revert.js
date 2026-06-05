import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const tables = ['equipment', 'customers', 'bookings', 'booking_items', 'promo_codes'];
  for (const table of tables) {
    const { error } = await supabaseAdmin.rpc('exec_sql', { sql: `ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY;` });
    console.log(table, error);
  }
}
test();
