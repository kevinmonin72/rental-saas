const fs = require('fs');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function cleanDbNames() {
  const { data: equipments, error } = await supabase
    .from('equipment')
    .select('id, name, reference')
    .ilike('reference', 'LOK-%');

  if (error) {
    console.error("Error fetching equipment:", error);
    return;
  }

  console.log(`Fetched ${equipments.length} LOK- generic equipment items.`);

  let updateCount = 0;
  for (const eq of equipments) {
    const cleanedName = eq.name.replace(/\s*-\s*\d+\s*jours?\s*$/i, '').trim();
    if (cleanedName !== eq.name) {
      console.log(`Updating "${eq.name}" -> "${cleanedName}"`);
      const { error: updateErr } = await supabase
        .from('equipment')
        .update({ name: cleanedName })
        .eq('id', eq.id);
      
      if (updateErr) {
        console.error(`Error updating equipment ${eq.id}:`, updateErr);
      } else {
        updateCount++;
      }
    }
  }

  console.log(`Cleaned up ${updateCount} names in the database successfully.`);
}

cleanDbNames();
