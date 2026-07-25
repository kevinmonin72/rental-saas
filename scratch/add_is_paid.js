import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.prod.vercel' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE bookings ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;' });
  
  if (error) {
    console.error('RPC failed, trying raw query or fallback...');
    // If rpc execute_sql doesn't exist, we can't alter table via postgrest.
    // Let's check if we can insert it. We might need to run a migration.
    console.log(error);
  } else {
    console.log('Column added', data);
  }
}
addColumn();
