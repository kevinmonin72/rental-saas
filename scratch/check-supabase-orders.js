const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log("Checking Supabase for shopify_orders...");
  
  // Let's count how many orders we have in the DB since Jan 1st 2026
  const { count, error: countErr } = await supabase
    .from('shopify_orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', '2026-01-01T00:00:00Z');

  if (countErr) {
    console.error("Error counting orders:", countErr);
  } else {
    console.log(`Total orders in Supabase since 2026-01-01: ${count}`);
  }

  // Fetch some early orders from Jan 2026
  const { data, error } = await supabase
    .from('shopify_orders')
    .select('*')
    .gte('created_at', '2026-01-01T00:00:00Z')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error("Error fetching early orders:", error);
  } else {
    console.log("Early orders in Supabase:");
    data.forEach(o => {
      console.log(`- ${o.name || o.order_number || o.id} | Created: ${o.created_at} | Total: ${o.total_price}`);
    });
  }
}

main().catch(console.error);
