import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.prod.vercel' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: b } = await supabaseAdmin.from('bookings').select('*').limit(1);
  console.log(Object.keys(b[0]));
}
test();
