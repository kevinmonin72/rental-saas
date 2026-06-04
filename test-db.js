import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function search() {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .or(`reference.ilike.%2805261%,name.ilike.%2805261%`);
    
  console.log('Result:', data);
  if (error) console.error('Error:', error);
}

search();
