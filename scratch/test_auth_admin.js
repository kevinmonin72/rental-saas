const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function test() {
  const existingEmail = 'lucas.jacquier@theridery.com';
  console.log('Testing magiclink generation for an existing user:', existingEmail);
  
  try {
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: existingEmail,
      options: {
        redirectTo: 'http://localhost:3000/espace-client'
      }
    });

    if (linkError) {
      console.log('Error message:', linkError.message);
    } else {
      console.log('Link generated successfully for existing user:', linkData.properties.action_link);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

test();
