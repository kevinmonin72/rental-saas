import { supabaseProxy } from './lib/supabase-proxy.js';
import { supabaseAdmin } from './lib/supabase-admin.js';

async function test() {
  console.log('Testing Admin directly...');
  const { data, error } = await supabaseAdmin.from('customers').select('*').limit(1);
  console.log('Admin:', { data, error });
}
test();
