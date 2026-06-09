require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log("Fetching all equipment with ORDER BY...");
  let allEq = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabaseAdmin.from('equipment').select('id, reference').order('id').range(from, from + limit - 1);
    if (error) {
      console.log("Error fetching:", error);
      return;
    }
    if (data && data.length > 0) {
      allEq = [...allEq, ...data];
      from += limit;
      if (data.length < limit) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${allEq.length} items.`);

  console.log("Fetching booking items to know which IDs to preserve...");
  let allBookingItems = [];
  from = 0; hasMore = true;
  while (hasMore) {
    const { data } = await supabaseAdmin.from('booking_items').select('equipment_id').order('id').range(from, from + limit - 1);
    if (data && data.length > 0) {
      allBookingItems = [...allBookingItems, ...data];
      from += limit;
      if (data.length < limit) hasMore = false;
    } else hasMore = false;
  }
  
  const usedEqIds = new Set(allBookingItems.map(bi => bi.equipment_id));
  console.log(`Found ${usedEqIds.size} unique equipment items in bookings.`);

  const refToIds = new Map();
  for (const eq of allEq) {
    if (!eq.reference) continue;
    if (!refToIds.has(eq.reference)) {
      refToIds.set(eq.reference, []);
    }
    refToIds.get(eq.reference).push(eq.id);
  }

  const idsToDelete = [];
  for (const [ref, ids] of refToIds.entries()) {
    if (ids.length > 1) {
      // Sort so that used IDs come first
      ids.sort((a, b) => {
        const aUsed = usedEqIds.has(a) ? 1 : 0;
        const bUsed = usedEqIds.has(b) ? 1 : 0;
        return bUsed - aUsed;
      });
      // Keep the first one, delete the rest
      for (let i = 1; i < ids.length; i++) {
        idsToDelete.push(ids[i]);
      }
    }
  }

  console.log(`Found ${idsToDelete.length} duplicate IDs to delete.`);

  // Delete in chunks of 500
  for (let i = 0; i < idsToDelete.length; i += 500) {
    const chunk = idsToDelete.slice(i, i + 500);
    const { error } = await supabaseAdmin.from('equipment').delete().in('id', chunk);
    if (error) console.log("Error deleting chunk:", error);
    else console.log(`Deleted chunk ${i/500 + 1}`);
  }
  
  console.log("Deduplication complete!");
}
main();
