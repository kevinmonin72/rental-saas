import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

let cachedCatalog = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const refresh = searchParams.get('refresh');

  if (!refresh && cachedCatalog && (Date.now() - lastCacheTime < CACHE_TTL)) {
    return NextResponse.json({ equipments: cachedCatalog });
  }

  try {
    let allData = [];
    let from = 0;
    const limit = 1000;
    let hasMore = true;

    // Fetch all equipment to group them
    while (hasMore) {
      const { data, error } = await supabaseAdmin.from('equipment').select('*').range(from, from + limit - 1);
      if (error) throw error;
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += limit;
        if (data.length < limit) hasMore = false;
      } else {
        hasMore = false;
      }
    }

    // Group by reference to avoid duplicates and sum quantities
    const grouped = {};
    for (const item of allData) {
      const ref = item.reference || item.name;
      if (!ref) continue;
      
      if (!grouped[ref]) {
        grouped[ref] = { ...item };
      } else {
        grouped[ref].quantity += (parseInt(item.quantity) || 1);
      }
    }

    const uniqueEquipments = Object.values(grouped);
    
    // Update cache
    cachedCatalog = uniqueEquipments;
    lastCacheTime = Date.now();

    return NextResponse.json({ equipments: uniqueEquipments });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
