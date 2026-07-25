require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const email = 'lucas.jacquier@theridery.com';
  const { data: custs } = await supabaseAdmin.from('customers').select('*').eq('email', email);
  
  if (!custs || custs.length <= 1) {
    console.log("No duplicates to clean up.");
    return;
  }

  console.log(`Found ${custs.length} customer records for ${email}`);
  
  // Keep the one with ID 8d485cc3-034a-4a32-bd86-0cde29c478f9
  const masterId = '8d485cc3-034a-4a32-bd86-0cde29c478f9';
  const master = custs.find(c => c.id === masterId) || custs[0];
  console.log(`Keeping Master ID: ${master.id}`);

  const duplicates = custs.filter(c => c.id !== master.id);
  for (const dup of duplicates) {
    console.log(`Deleting duplicate ID: ${dup.id} (created at: ${dup.created_at})`);
    
    // Safety check: delete any potential linked items (cascade usually handles this)
    await supabaseAdmin.from('bookings').delete().eq('customer_id', dup.id);
    
    const { error } = await supabaseAdmin.from('customers').delete().eq('id', dup.id);
    if (error) {
      console.error(`Error deleting ${dup.id}:`, error);
    } else {
      console.log(`Deleted ${dup.id}`);
    }
  }

  console.log("Deduplication complete!");
}

main();
