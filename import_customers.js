const fs = require('fs');
const Papa = require('papaparse');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabase = createClient('https://amfacpwujrkhpspihdrx.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtZmFjcHd1anJraHBzcGloZHJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTg1MTcsImV4cCI6MjA5NTQzNDUxN30.QZ8lMBUbAdb2ciTbyaOnXqpcqxfCSMK2iyx6Fpkwgrk');

async function run() {
  console.log('Suppression des clients existants...');
  
  // Since we want to delete all customers, and we can't use TRUNCATE via PostgREST easily without an explicit filter:
  // Using an open filter .neq('id', '00000000-0000-0000-0000-000000000000') to delete all.
  const { error: delError } = await supabase
    .from('customers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (delError) {
    console.error('Erreur lors de la suppression:', delError);
    return;
  }
  console.log('Anciens clients supprimés.');

  console.log('Lecture du fichier CSV...');
  const fileContent = fs.readFileSync('/Users/kevinmonin/Downloads/customers_export.csv', 'utf8');
  
  const parsed = Papa.parse(fileContent.trim(), {
    header: true,
    skipEmptyLines: true
  });
  
  console.log(`${parsed.data.length} lignes trouvées dans le CSV.`);
  
  const customersToInsert = [];
  
  for (const row of parsed.data) {
    const fn = row['First Name'] || '';
    const ln = row['Last Name'] || '';
    const email = row['Email'] || '';
    const phone = row['Phone'] || row['Default Address Phone'] || '';
    
    // Only import if there's at least a name or an email
    if (fn.trim() !== '' || ln.trim() !== '' || email.trim() !== '') {
      customersToInsert.push({
        id: uuidv4(),
        first_name: fn.trim(),
        last_name: ln.trim(),
        email: email.trim(),
        phone: phone.replace(/'/g, '').trim() // some phones have ' prepended in CSVs to force string
      });
    }
  }

  console.log(`${customersToInsert.length} clients valides à insérer.`);
  
  // Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;
  
  for (let i = 0; i < customersToInsert.length; i += BATCH_SIZE) {
    const batch = customersToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('customers').insert(batch);
    if (error) {
      console.error(`Erreur au lot ${i}:`, error);
    } else {
      inserted += batch.length;
      console.log(`Inséré ${inserted} clients...`);
    }
  }
  
  console.log('Terminé !');
}

run();
