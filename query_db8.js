const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: customers } = await supabase.from('customers').select('*').in('id', ['28087f65-8d19-4ec2-90ae-4946c469e34d', 'f44286af-c755-424b-83d1-449c3148fa23']);
  console.log("Customers:", customers);
}
check();
