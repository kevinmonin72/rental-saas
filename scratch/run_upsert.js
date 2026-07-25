const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.prod.vercel' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const chunk = [
    {
      id: crypto.randomUUID(),
      reference: '07072601',
      name: 'Test Planche 95L',
      category: 'Général',
      quantity: 1,
      brand: null
    }
  ];
  
  const { error } = await supabase.from('equipment').upsert(chunk);
  if (error) {
     console.error("Erreur lors de l'upsert :", error);
  } else {
     console.log("Upsert successful!");
  }
}
run();
