import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { GENERIC_EQUIPMENTS } from '../../../../lib/catalog';

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
    const references = GENERIC_EQUIPMENTS.map(e => e.reference);
    
    // Instead of querying 28,000 rows, only query the generic references we care about
    const { data: allData, error } = await supabaseAdmin
      .from('equipment')
      .select('reference, quantity, name')
      .in('reference', references);

    if (error) throw error;

    // We build the grouped response based on GENERIC_EQUIPMENTS as the base
    const grouped = {};
    for (const gen of GENERIC_EQUIPMENTS) {
      grouped[gen.reference] = { ...gen, quantity: 0 };
    }

    if (allData) {
      for (const item of allData) {
        if (grouped[item.reference]) {
          grouped[item.reference].quantity += (parseInt(item.quantity) || 1);
        }
      }
    }

    const uniqueEquipments = Object.values(grouped).filter(e => e.quantity > 0 || e.reference.includes('-OPT'));
    
    // Update cache
    cachedCatalog = uniqueEquipments;
    lastCacheTime = Date.now();

    return NextResponse.json({ equipments: uniqueEquipments });
  } catch (err) {
    console.error("API Catalog Error:", err);
    // Fallback to GENERIC_EQUIPMENTS directly in case of error
    return NextResponse.json({ equipments: GENERIC_EQUIPMENTS });
  }
}
