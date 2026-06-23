import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { GENERIC_EQUIPMENTS } from '../../../../lib/catalog';

export const dynamic = 'force-dynamic';

let cachedCatalog = null;
let lastCacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const staticCategories = {};
for (const item of GENERIC_EQUIPMENTS) {
  staticCategories[item.reference] = item.category;
}

function getCategoryFromReference(reference, name = '') {
  const ref = (reference || '').toUpperCase();
  const n = (name || '').toLowerCase();
  
  if (ref.includes('-CS') || ref.includes('CS-') || n.includes('carte session')) {
    return 'Carte Session';
  }
  if (ref.includes('KITE') || ref.includes('BARRE') || ref.includes('TWINTIP') || ref.includes('STRAPLESS') || ref.includes('AILE') ||
      n.includes('kite') || n.includes('barre') || n.includes('twintip') || n.includes('strapless') || n.includes('aile')) {
    if (!ref.includes('WING') && !n.includes('wing')) {
      return 'Kitesurf';
    }
  }
  if (ref.includes('WING') || ref.includes('FOIL') || n.includes('wing') || n.includes('foil')) {
    return 'Wingfoil';
  }
  if (ref.includes('NEOPRENE') || ref.includes('COMBINAISON') || ref.includes('CAGOULE') || ref.includes('CHAUSSONS') || ref.includes('GANTS') || ref.includes('VESTENEOPRENE') ||
      n.includes('combinaison') || n.includes('cagoule') || n.includes('chausson') || n.includes('gant') || n.includes('veste néoprène') || n.includes('néoprène')) {
    return 'Néoprène';
  }
  if (ref.includes('HARNAIS') || ref.includes('BOARDBAG') || ref.includes('BAG') || n.includes('harnais') || n.includes('boardbag') || n.includes('sac')) {
    return 'Accessoires';
  }
  if (ref.includes('PROT') || ref.includes('CASQUE') || ref.includes('GILET') || n.includes('casque') || n.includes('gilet')) {
    return 'Protections';
  }
  if (ref.includes('SURF') || ref.includes('PADDLE') || n.includes('surf') || n.includes('paddle')) {
    return 'Autres';
  }
  return 'Autres';
}

export async function GET(request) {
  try {
    // Query all records starting with LOK-
    const { data: allData, error } = await supabaseAdmin
      .from('equipment')
      .select('reference, quantity, name, brand')
      .like('reference', 'LOK-%');

    if (error) throw error;

    // Filter out duplicates and group them by reference
    const grouped = {};
    if (allData) {
      for (const item of allData) {
        if (!grouped[item.reference]) {
          const category = staticCategories[item.reference] || getCategoryFromReference(item.reference, item.name);
          grouped[item.reference] = {
            reference: item.reference,
            name: item.name,
            category: category,
            quantity: 0,
            imageUrl: item.brand || null
          };
        }
        grouped[item.reference].quantity += (parseInt(item.quantity) || 0);
        // Keep the imageUrl if found
        if (item.brand && !grouped[item.reference].imageUrl) {
          grouped[item.reference].imageUrl = item.brand;
        }
      }
    }

    // Fallback/base check to make sure everything from GENERIC_EQUIPMENTS is present
    for (const gen of GENERIC_EQUIPMENTS) {
      if (!grouped[gen.reference]) {
        grouped[gen.reference] = { ...gen, quantity: 10, imageUrl: null };
      }
    }

    // Force all generic equipments to have at least quantity 10 so they always show up
    const uniqueEquipments = Object.values(grouped).map(e => {
      if (e.quantity <= 0) e.quantity = 10;
      return e;
    });

    return NextResponse.json({ equipments: uniqueEquipments });
  } catch (err) {
    console.error("API Catalog Error:", err);
    // Fallback to GENERIC_EQUIPMENTS directly in case of error
    return NextResponse.json({ equipments: GENERIC_EQUIPMENTS });
  }
}
