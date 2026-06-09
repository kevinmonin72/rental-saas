import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

async function fetchWithRetry(url, token) {
  let attempts = 0;
  while (attempts < 3) {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (res.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    } else {
      return res;
    }
  }
  throw new Error("Max retries reached for 429");
}

export async function POST(request) {
  const { type } = await request.json(); // 'inventory' or 'customers'
  
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!token || !domain) {
    return NextResponse.json({ error: 'Shopify credentials missing' }, { status: 500 });
  }

  try {
    if (type === 'inventory') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      let url = `https://${domain}/admin/api/2024-01/products.json?status=any&limit=250&updated_at_min=${thirtyDaysAgo}`;
      let hasNext = true;
      let allVariantsMap = new Map();

      // We'll limit to max 5 pages to avoid Vercel timeout on Hobby plan (10s)
      let pageCount = 0;
      while (hasNext && pageCount < 5) {
        pageCount++;
        const res = await fetchWithRetry(url, token);
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        for (const product of data.products) {
          for (const variant of product.variants) {
            const ref = variant.sku || variant.barcode || variant.id.toString();
            if (ref) {
              allVariantsMap.set(ref, {
                reference: ref,
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
      
      if (allVariants.length > 0) {
        const { data: currentEquipments } = await supabaseAdmin.from('equipment').select('id, reference');
        let toUpsertEq = [];
        
        for (const item of allVariants) {
          const existing = currentEquipments.find(e => e.reference === item.reference);
          toUpsertEq.push({
            id: existing ? existing.id : require('crypto').randomUUID(),
            ...item
          });
        }

        // Upsert in chunks of 500
        for (let i = 0; i < toUpsertEq.length; i += 500) {
          const chunk = toUpsertEq.slice(i, i + 500);
          await supabaseAdmin.from('equipment').upsert(chunk);
        }
      }

      return NextResponse.json({ success: true, count: allVariants.length });
    }
    
    if (type === 'customers') {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      let url = `https://${domain}/admin/api/2024-01/customers.json?limit=250&updated_at_min=${thirtyDaysAgo}`;
      let hasNext = true;
      let allCustomersMap = new Map();
      let pageCount = 0;

      while (hasNext && pageCount < 5) {
        pageCount++;
        const res = await fetchWithRetry(url, token);
        if (!res.ok) throw new Error(await res.text());
        
        const data = await res.json();
        for (const customer of data.customers) {
          const key = customer.email || customer.phone || customer.id.toString();
          allCustomersMap.set(key, {
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
      
      if (allCustomers.length > 0) {
        const { data: dbCustomers } = await supabaseAdmin.from('customers').select('id, email, phone');
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
            address: c.address
          });
        }

        // Deduplicate before upserting into Supabase
        const uniqueToUpsertCusMap = new Map();
        toUpsertCus.forEach(c => uniqueToUpsertCusMap.set(c.id, c));
        const uniqueToUpsertCus = Array.from(uniqueToUpsertCusMap.values());

        for (let i = 0; i < uniqueToUpsertCus.length; i += 500) {
          const chunk = uniqueToUpsertCus.slice(i, i + 500);
          await supabaseAdmin.from('customers').upsert(chunk);
        }
      }

      return NextResponse.json({ success: true, count: allCustomers.length });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

  } catch (error) {
    console.error("Shopify Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
