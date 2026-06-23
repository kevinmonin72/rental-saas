import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Find duplicates for Augustin Durivault
const { data: bookings } = await supabase
  .from('bookings')
  .select('*, customers(first_name, last_name)')
  .eq('rental_type', 'wingboost')
  .eq('status', 'active');

// Group by customer_id + start_date + end_date to find duplicates
const groups = {};
for (const b of bookings) {
  const key = `${b.customer_id}_${b.start_date}_${b.end_date}_${b.rental_type}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(b);
}

for (const [key, group] of Object.entries(groups)) {
  if (group.length > 1) {
    const name = `${group[0].customers?.first_name} ${group[0].customers?.last_name}`;
    console.log(`\n🔴 DOUBLON: ${name} (${group.length}x)`);
    group.forEach(b => console.log(`   - ${b.reference || b.id.slice(0,8)} | ${b.start_date} → ${b.end_date} | shopify_transfer=${b.shopify_transfer}`));
    
    // Keep the first one (oldest), delete the rest
    const toDelete = group.slice(1);
    for (const dup of toDelete) {
      console.log(`   🗑️  Suppression de ${dup.reference || dup.id.slice(0,8)}...`);
      await supabase.from('booking_items').delete().eq('booking_id', dup.id);
      await supabase.from('bookings').delete().eq('id', dup.id);
      console.log(`   ✅ Supprimé`);
    }
  }
}

console.log('\nTerminé !');
