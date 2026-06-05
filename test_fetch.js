import dotenv from 'dotenv';
dotenv.config({path:'.env.local'});
import { supabaseProxy } from './lib/supabase-proxy.js';
async function test() {
  const { data, error } = await supabaseProxy.from('customers').select('*').limit(1);
  console.log({ data, error });
}
test();
