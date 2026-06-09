require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
async function main() {
  let allRef = new Set();
  let from = 0;
  const limit = 1000;
  let hasMore = true;
  while (hasMore) {
    const { data } = await supabaseAdmin.from('equipment').select('reference').range(from, from + limit - 1);
    if (!data || data.length === 0) break;
    data.forEach(d => {
      if (d.reference) allRef.add(d.reference);
    });
    from += limit;
  }
  console.log("Total unique references in database:", allRef.size);
}
main();
