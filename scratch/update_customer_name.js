require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: updated, error } = await supabaseAdmin
    .from('customers')
    .update({ first_name: "Kevin", last_name: "Monin" })
    .eq('email', 'marseille@theridery.com')
    .select();

  if (error) {
    console.error("Error updating customer:", error);
  } else {
    console.log("Successfully updated customer name to Kevin Monin!", JSON.stringify(updated, null, 2));
  }
}

main();
