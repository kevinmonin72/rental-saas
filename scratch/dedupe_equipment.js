const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.prod.vercel' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log('Fetching all equipment (paginated)...');
  
  let allEq = [];
  let from = 0;
  const limit = 1000;
  
  while (true) {
    const { data, error } = await supabase.from('equipment').select('id, reference, created_at').range(from, from + limit - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allEq = allEq.concat(data);
    from += limit;
  }
  
  console.log('Total equipment fetched:', allEq.length);

  console.log('Fetching booking items...');
  const { data: bookingItems, error: biErr } = await supabase.from('booking_items').select('equipment_id');
  if (biErr) throw biErr;

  const usedIds = new Set(bookingItems.map(b => b.equipment_id));
  console.log('Used equipment IDs:', usedIds.size);

  const byRef = {};
  for (const eq of allEq) {
    if (!eq.reference) continue; 
    if (!byRef[eq.reference]) byRef[eq.reference] = [];
    byRef[eq.reference].push(eq);
  }

  let toDelete = [];

  for (const [ref, items] of Object.entries(byRef)) {
    if (items.length > 1) {
      items.sort((a, b) => {
        const aUsed = usedIds.has(a.id);
        const bUsed = usedIds.has(b.id);
        if (aUsed && !bUsed) return -1;
        if (!aUsed && bUsed) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      let keptOne = false;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (usedIds.has(item.id)) {
          keptOne = true;
        } else {
          if (!keptOne) {
            keptOne = true; 
          } else {
            toDelete.push(item.id);
          }
        }
      }
    }
  }

  console.log(`Found ${toDelete.length} equipment items to delete.`);
  
  // Chunk delete
  const chunkSize = 500;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize);
    const { error } = await supabase.from('equipment').delete().in('id', chunk);
    if (error) {
      console.error('Error deleting chunk:', error);
      break;
    }
    deleted += chunk.length;
    console.log(`Deleted ${deleted}/${toDelete.length}`);
  }
  console.log('Done!');
}
run();
