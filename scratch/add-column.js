import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Add shopify_order_id column to bookings table
const { error } = await supabase.rpc('exec_sql', { 
  query: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;` 
});

if (error) {
  // If RPC doesn't exist, try raw SQL via REST
  console.log('RPC not available, trying direct approach...');
  
  // Check if column exists
  const { data: cols } = await supabase
    .from('bookings')
    .select('*')
    .limit(1);
  
  if (cols && cols.length > 0 && !('shopify_order_id' in cols[0])) {
    console.log('Column shopify_order_id does not exist yet.');
    console.log('⚠️  Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log('');
    console.log('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shopify_order_id TEXT;');
    console.log('CREATE INDEX IF NOT EXISTS idx_bookings_shopify_order_id ON bookings(shopify_order_id);');
  } else if (cols && cols.length > 0) {
    console.log('✅ Column shopify_order_id already exists!');
  }
} else {
  console.log('✅ Column added successfully!');
}
