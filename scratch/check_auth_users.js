require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("=== AUTH USERS ===");
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error("Error listing users:", error);
    return;
  }

  console.log(`Total Auth Users: ${users.length}`);
  users.forEach(u => {
    console.log(`User ID: ${u.id}`);
    console.log(`  Email: ${u.email}`);
    console.log(`  Role: ${u.role}`);
    console.log(`  Created At: ${u.created_at}`);
    console.log(`  Confirmed At: ${u.confirmed_at}`);
    console.log(`  Last Sign In: ${u.last_sign_in_at}`);
    console.log("-----------------------------------------");
  });
}

main();
