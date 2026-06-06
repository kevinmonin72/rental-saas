import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: customers } = await supabase.from('customers').select('*').eq('email', 'kevin.monin72@gmail.com').order('created_at', { ascending: false });
  if (customers && customers.length > 1) {
    const idsToDelete = customers.slice(1).map(c => c.id);
    console.log('Deleting duplicate ids:', idsToDelete);
    const { error } = await supabase.from('customers').delete().in('id', idsToDelete);
    console.log('Delete error:', error);
  } else {
    console.log('No duplicates found.');
  }
}
main();
