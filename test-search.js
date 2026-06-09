require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  
  console.log("Searching Shopify for 0606262...");
  const res = await fetch(`https://${domain}/admin/api/2024-01/products.json?title=0606262`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data = await res.json();
  console.log("Shopify title search:", data.products?.map(p => p.title));
  
  const res2 = await fetch(`https://${domain}/admin/api/2024-01/products.json?sku=0606262`, {
    headers: { 'X-Shopify-Access-Token': token }
  });
  const data2 = await res2.json();
  console.log("Shopify sku search:", data2.products?.map(p => p.title));
  
  console.log("Searching Supabase for 0606262...");
  const { data: dbData } = await supabase.from('equipment').select('*').or('name.ilike.%0606262%,reference.ilike.%0606262%');
  console.log("Supabase search:", dbData?.map(d => d.reference));
}

main();
