require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fetchWithRetry(url, token) {
  let attempts = 0;
  while (attempts < 5) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (res.status === 429) {
      console.log("Rate limited, waiting 2s...");
      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    } else {
      return res;
    }
  }
  throw new Error("Max retries reached for 429");
}

async function syncShopify() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!token || !domain) return;
  console.log(`Starting sync for domain: ${domain}`);

  // --- EQUIPMENTS ---
  console.log("\n--- Syncing Active Products ---");
  let url = `https://${domain}/admin/api/2024-01/products.json?status=active&limit=250`;
  let hasNext = true;
  let allVariantsMap = new Map();

  while (hasNext) {
    const res = await fetchWithRetry(url, token);
    if (!res.ok) {
      console.error("Failed to fetch products:", await res.text());
      return;
    }
    const data = await res.json();
    for (const product of data.products) {
      for (const variant of product.variants) {
        if (variant.sku) {
           allVariantsMap.set(variant.sku, {
             reference: variant.sku,
             name: `${product.title} ${variant.title !== 'Default Title' ? '- ' + variant.title : ''}`.trim(),
             category: product.product_type || 'Général',
             quantity: variant.inventory_quantity || 0,
           });
        }
      }
    }
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else hasNext = false;
  }

  const allVariants = Array.from(allVariantsMap.values());
  console.log(`Found ${allVariants.length} unique active variants from Shopify.`);

  const { data: currentEquipments } = await supabase.from('equipment').select('*');
  let toUpsertEq = [];
  
  for (const item of allVariants) {
    const existing = currentEquipments.find(e => e.reference === item.reference);
    toUpsertEq.push({
      id: existing ? existing.id : require('crypto').randomUUID(),
      ...item
    });
  }

  console.log("Upserting equipments...");
  for (let i = 0; i < toUpsertEq.length; i += 500) {
    const chunk = toUpsertEq.slice(i, i + 500);
    const { error } = await supabase.from('equipment').upsert(chunk);
    if (error) console.error("Error upserting equipment:", error);
  }

  let supprEq = [];
  for (const eq of currentEquipments) {
    if (!eq.reference.startsWith('LOK-')) {
      if (!allVariantsMap.has(eq.reference)) {
        supprEq.push(eq.id);
      }
    }
  }

  if (supprEq.length > 0) {
    console.log(`Deleting ${supprEq.length} old equipments...`);
    for (let i = 0; i < supprEq.length; i += 500) {
      await supabase.from('equipment').delete().in('id', supprEq.slice(i, i + 500));
    }
  }

  // --- CUSTOMERS ---
  console.log("\n--- Syncing Customers ---");
  url = `https://${domain}/admin/api/2024-01/customers.json?limit=250`;
  hasNext = true;
  let allCustomersMap = new Map();

  while (hasNext) {
    const res = await fetchWithRetry(url, token);
    if (!res.ok) {
      console.error("Failed to fetch customers:", await res.text());
      return;
    }
    const data = await res.json();
    for (const customer of data.customers) {
       const key = customer.email || customer.phone || customer.id.toString();
       allCustomersMap.set(key, {
         shopify_id: customer.id.toString(),
         first_name: customer.first_name || '',
         last_name: customer.last_name || '',
         email: customer.email || null,
         phone: customer.phone || null,
         address: customer.default_address ? `${customer.default_address.address1}, ${customer.default_address.city}` : null
       });
    }
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      if (!url) hasNext = false;
    } else hasNext = false;
  }

  const allCustomers = Array.from(allCustomersMap.values());
  console.log(`Found ${allCustomers.length} unique customers from Shopify.`);
  
  // Deduplicate before upserting into Supabase
  const { data: dbCustomers } = await supabase.from('customers').select('*');
  let toUpsertCus = [];

  for (const c of allCustomers) {
    let existing = dbCustomers.find(dbC => dbC.email === c.email && c.email) || 
                   dbCustomers.find(dbC => dbC.phone === c.phone && c.phone);
    
    toUpsertCus.push({
      id: existing ? existing.id : require('crypto').randomUUID(),
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      address: c.address || (existing && existing.address ? existing.address : null)
    });
  }

  // Ensure unique IDs in chunk
  const uniqueToUpsertCusMap = new Map();
  toUpsertCus.forEach(c => uniqueToUpsertCusMap.set(c.id, c));
  const uniqueToUpsertCus = Array.from(uniqueToUpsertCusMap.values());

  console.log("Upserting customers...");
  for (let i = 0; i < uniqueToUpsertCus.length; i += 500) {
    const chunk = uniqueToUpsertCus.slice(i, i + 500);
    const { error } = await supabase.from('customers').upsert(chunk);
    if (error) console.error("Error upserting customers:", error);
  }

  console.log("\n--- Sync Complete ---");
}

syncShopify();
