require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: refLok, error } = await supabaseAdmin
    .from('equipment')
    .select('id, name, reference, category, brand')
    .like('reference', 'LOK-%');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const withImage = refLok.filter(e => e.brand);
  console.log(`Found ${refLok.length} equipments starting with 'LOK-'.`);
  console.log(`Found ${withImage.length} equipments with an image URL stored in 'brand':`);
  if (withImage.length > 0) {
    console.log(JSON.stringify(withImage, null, 2));
  } else {
    console.log("No items have an image URL in the DB.");
  }
}
main();
