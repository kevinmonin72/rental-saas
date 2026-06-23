require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const GENERIC_EQUIPMENTS = [
  { reference: 'LOK-BOARDBAG-OPT', name: 'Boardbag opt.', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-PACK-KITE', name: 'Pack Kitesurf - à personnaliser ', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-AILE-BARRE', name: 'Aile + Barre', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-PACK-2AILES-BARRE', name: 'Pack 2 Ailes + Barre', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-BOARD-TWINTIP', name: 'Planche Twintip', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-WING-AILE', name: 'Aile de Wing', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-HARNAIS-CULOTTE', name: 'Harnais culotte', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-AILE-SANSBARRE', name: 'Deuxième aile (sans barre)', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-NEOPRENE-COMBINAISON', name: 'Combinaison', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-PACK-WING-GONFLABLE', name: 'Pack Wing gonflable', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-NEOPRENE-CAGOULE', name: 'Cagoule', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-PACK-WING-RIGIDE', name: 'Pack Wing rigide', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-PACK-WING-DEBUTANT', name: 'Pack Wing débutant', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-WING-FOIL', name: 'Foil de Wing', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-WING-BOARD', name: 'Planche de Wing', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-WING-2AILE', name: 'Deuxième Aile de Wing', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-CAGOULE-OPT', name: 'Cagoule opt.', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-CHAUSSONS-OPT', name: 'Chaussons opt.', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-GANTS-OPT', name: 'Gants opt.', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-HARNAIS-CEINTURE', name: 'Harnais ceinture', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-NEOPRENE-VESTE', name: 'Veste néoprène', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-NEOPRENE-CHAUSSONS', name: 'Chaussons', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-COMBINAISON-OPT', name: 'Combinaison opt.', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-BOARDBAG', name: 'Boardbag', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-NEOPRENE-GANTS', name: 'Gants', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-HARNAIS-CEINTURE-OPT', name: 'Harnais ceinture opt.', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-PROT-CASQUE', name: 'Casque', category: 'Protections', quantity: 10 },
  { reference: 'LOK-VESTENEOPRENE-OPT', name: 'Veste Néoprène opt.', category: 'Néoprène', quantity: 10 },
  { reference: 'LOK-PROT-GILET', name: 'Gilet', category: 'Protections', quantity: 10 },
  { reference: 'LOK-CASQUE-OPT', name: 'Casque opt.', category: 'Protections', quantity: 10 },
  { reference: 'LOK-GILET-OPT', name: 'Gilet opt.', category: 'Protections', quantity: 10 },
  { reference: 'LOK-HARNAIS-CULOTTE-OPT', name: 'Harnais Culotte opt.', category: 'Accessoires', quantity: 10 },
  { reference: 'LOK-3AILE-SANSBARRE', name: 'Troisième aile (sans barre)', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-2AILE-SANSBARRE-CS', name: 'Deuxième aile (sans barre) - carte session', category: 'Carte Session', quantity: 10 },
  { reference: 'LOK-3AILE-SANSBARRE-CS', name: 'Troisième aile (sans barre) - carte session', category: 'Carte Session', quantity: 10 },
  { reference: 'LOK-TWINTIP-OPT-CS', name: 'Planche Twintip opt. - carte session', category: 'Carte Session', quantity: 10 },
  { reference: 'LOK-2WING-AILE-CS', name: 'Deuxième Aile de Wing - carte session', category: 'Carte Session', quantity: 10 },
  { reference: 'LOK-BARRE', name: 'Barre', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-KITEFOIL', name: 'Kitefoil', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-STRAPLESS', name: 'Strapless', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-TWINTIP-OPT', name: 'Planche Twintip Opt.', category: 'Kitesurf', quantity: 10 },
  { reference: 'LOK-BOARD-FOIL-WING', name: 'Planche + Foil de Wing', category: 'Wingfoil', quantity: 10 },
  { reference: 'LOK-PADDLE', name: 'Paddle', category: 'Autres', quantity: 10 },
  { reference: 'LOK-SURF', name: 'Surf', category: 'Autres', quantity: 10 }
];

async function renameEquipments() {
  console.log("Renaming equipments in bulk by reference...");
  let count = 0;
  for (const eq of GENERIC_EQUIPMENTS) {
    let newName = eq.name.trim();
    if (!newName.startsWith("Location ")) {
      newName = `Location ${newName}`;
    }
    const { error, data } = await supabase.from('equipment')
      .update({ name: newName })
      .eq('reference', eq.reference)
      .not('name', 'eq', newName)
      .select();

    if (error) {
      console.error(`Error updating ${eq.reference}:`, error);
    } else {
      if (data && data.length > 0) {
        console.log(`Updated ${data.length} items for ${eq.reference}`);
        count += data.length;
      }
    }
  }

  console.log(`Successfully renamed ${count} equipments in Supabase.`);
  
  // Now update lib/catalog.js
  const catalogPath = './lib/catalog.js';
  if (fs.existsSync(catalogPath)) {
    let content = fs.readFileSync(catalogPath, 'utf-8');
    // Simple regex replace: name: 'Something' -> name: 'Location Something'
    content = content.replace(/name:\s*'([^']+)'/g, (match, p1) => {
      if (p1.startsWith('Location ')) return match;
      return `name: 'Location ${p1.trim()}'`;
    });
    fs.writeFileSync(catalogPath, content, 'utf-8');
    console.log("Updated lib/catalog.js with new names.");
  }
}

renameEquipments().catch(console.error);
