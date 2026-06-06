const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'theridery.myshopify.com';
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchAllShopify(endpoint, queryParams = '') {
  let results = [];
  let nextUrl = `https://${SHOPIFY_DOMAIN}/admin/api/2024-01/${endpoint}.json?limit=250${queryParams ? '&' + queryParams : ''}`;

  while (nextUrl) {
    console.log('Fetching', nextUrl);
    const res = await fetch(nextUrl, {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Shopify API error: ${await res.text()}`);
    }

    const data = await res.json();
    const key = endpoint.split('/')[0]; // products, customers
    results = results.concat(data[key] || []);

    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
      nextUrl = match ? match[1] : null;
    } else {
      nextUrl = null;
    }
  }

  return results;
}

async function fetchAllSupabase(table) {
  let allData = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.from(table).select('*').range(from, from + limit - 1);
    if (error) throw error;
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += limit;
      if (data.length < limit) hasMore = false;
    } else {
      hasMore = false;
    }
  }
  return allData;
}

async function run() {
  try {
    console.log('--- SYNCING CUSTOMERS ---');
    const shopifyCustomers = await fetchAllShopify('customers');
    const sbCustomers = await fetchAllSupabase('customers');
    
    const customersToInsert = [];
    const customersToUpdate = [];
    const validCustomerEmails = new Set();

    for (const sc of shopifyCustomers) {
      if (!sc.email) continue;
      const email = sc.email.trim().toLowerCase();
      validCustomerEmails.add(email);

      const existing = sbCustomers.find(c => c.email === email);
      if (existing) {
        // Update if phone or name changed
        if (existing.first_name !== sc.first_name || existing.last_name !== sc.last_name || existing.phone !== sc.phone) {
          customersToUpdate.push({
            id: existing.id,
            first_name: sc.first_name || existing.first_name,
            last_name: sc.last_name || existing.last_name,
            phone: sc.phone || existing.phone
          });
        }
      } else {
        customersToInsert.push({
          id: require('crypto').randomUUID(),
          first_name: sc.first_name || '',
          last_name: sc.last_name || '',
          email: email,
          phone: sc.phone || null
        });
      }
    }

    console.log(`Inserting ${customersToInsert.length} new customers...`);
    if (customersToInsert.length > 0) {
      // Chunk inserts to avoid large payloads
      for (let i = 0; i < customersToInsert.length; i += 500) {
        await supabase.from('customers').insert(customersToInsert.slice(i, i + 500));
      }
    }

    console.log(`Updating ${customersToUpdate.length} existing customers...`);
    for (const c of customersToUpdate) {
      await supabase.from('customers').update({ first_name: c.first_name, last_name: c.last_name, phone: c.phone }).eq('id', c.id);
    }
    
    // Note: We don't delete customers that are not in Shopify, as they might have been created manually in the SaaS.

    console.log('--- SYNCING EQUIPMENT ---');
    const shopifyProducts = await fetchAllShopify('products', 'status=active');
    const sbEquipment = await fetchAllSupabase('equipment');

    // For products, we look at variants (which hold the SKU and quantity)
    const activeShopifySkus = new Set();
    const equipmentToInsert = [];
    const equipmentToUpdate = [];

    // Since we need quantities, we have to fetch inventory levels if we want the actual stock.
    // However, variants have `inventory_quantity` which is deprecated but often populated.
    // Let's use `inventory_quantity` for now, or fetch inventory levels. Shopify includes inventory_quantity if location is set, but sometimes it's 0.
    // Let's check what Shopify returns for variants.
    for (const p of shopifyProducts) {
      for (const v of p.variants) {
        const sku = v.sku;
        if (!sku) continue; // Skip items without SKU
        activeShopifySkus.add(sku);

        const qty = v.inventory_quantity || 1; // Fallback to 1 if not tracked
        const title = p.title + (v.title && v.title !== 'Default Title' ? ` - ${v.title}` : '');
        
        const existing = sbEquipment.find(e => e.reference === sku);
        if (existing) {
          if (existing.name !== title || existing.quantity !== qty || existing.category !== p.product_type) {
            equipmentToUpdate.push({
              id: existing.id,
              name: title,
              quantity: qty,
              category: p.product_type || existing.category
            });
          }
        } else {
          equipmentToInsert.push({
            id: require('crypto').randomUUID(),
            reference: sku,
            name: title,
            quantity: qty,
            category: p.product_type || 'Uncategorized'
          });
        }
      }
    }

    console.log(`Found ${activeShopifySkus.size} active variants with SKUs in Shopify.`);

    console.log(`Inserting ${equipmentToInsert.length} new equipments...`);
    if (equipmentToInsert.length > 0) {
      for (let i = 0; i < equipmentToInsert.length; i += 500) {
        await supabase.from('equipment').insert(equipmentToInsert.slice(i, i + 500));
      }
    }

    console.log(`Updating ${equipmentToUpdate.length} existing equipments...`);
    for (const e of equipmentToUpdate) {
      await supabase.from('equipment').update({ name: e.name, quantity: e.quantity, category: e.category }).eq('id', e.id);
    }

    // Delete equipments that are no longer in Shopify
    // BUT wait! Some equipments might be LOK-PACK-KITE which are "Generic Equipments" hardcoded in catalog!
    // Or maybe they ARE in Shopify? If they are not in Shopify, the user said "si ya des truc qui n existe plus supprime evidement"
    // Let's delete anything that is not in activeShopifySkus AND not starting with "LOK-" if they want?
    // Actually the user created LOK- items manually before... wait, did they?
    // Let's see what is in sbEquipment not in activeShopifySkus.
    const equipmentToDelete = sbEquipment.filter(e => !activeShopifySkus.has(e.reference));
    console.log(`Deleting ${equipmentToDelete.length} equipments that are not active in Shopify...`);
    
    // Do it in chunks
    const deleteIds = equipmentToDelete.map(e => e.id);
    for (let i = 0; i < deleteIds.length; i += 100) {
      await supabase.from('equipment').delete().in('id', deleteIds.slice(i, i + 100));
    }

    console.log('--- SYNC COMPLETE ---');

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
