require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const GENERIC_EQUIPMENTS = require('./lib/catalog.js').GENERIC_EQUIPMENTS || [];

async function testApi() {
  const references = GENERIC_EQUIPMENTS.map(e => e.reference);
  console.log("References length:", references.length);

  try {
    const { data: allData, error } = await supabaseAdmin
      .from('equipment')
      .select('reference, quantity, name')
      .in('reference', references);

    if (error) throw error;
    console.log("Data fetched:", allData.length);

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
    console.log("Unique equipments length:", uniqueEquipments.length);
    if (uniqueEquipments.length === 0) {
      console.log("WAIT! IT FILTERED OUT EVERYTHING!");
      console.log("Grouped object values:", Object.values(grouped).slice(0, 3));
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testApi();
