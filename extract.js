const fs = require('fs');

const refsMap = {
  "Boardbag opt.": "LOK-BOARDBAG-OPT",
  "Pack Kitesurf - à personnaliser ✨": "LOK-PACK-KITE",
  "Pack 2 Ailes + Barre": "LOK-PACK-2AILES-BARRE",
  "Planche Twintip opt. - carte session": "LOK-TWINTIP-OPT-CS",
  "Planche Twintip Opt.": "LOK-TWINTIP-OPT",
  "Planche Twintip": "LOK-BOARD-TWINTIP",
  "Planche + Foil de Wing": "LOK-BOARD-FOIL-WING",
  "Planche de Wing": "LOK-WING-BOARD",
  "Foil de Wing": "LOK-WING-FOIL",
  "Aile de Wing": "LOK-WING-AILE",
  "Deuxième Aile de Wing  - carte session": "LOK-2WING-AILE-CS",
  "Deuxième Aile de Wing": "LOK-WING-2AILE",
  "Harnais culotte": "LOK-HARNAIS-CULOTTE",
  "Troisième aile (sans barre) - carte session": "LOK-3AILE-SANSBARRE-CS",
  "Deuxième aile (sans barre) - carte session": "LOK-2AILE-SANSBARRE-CS",
  "Troisième aile (sans barre)": "LOK-3AILE-SANSBARRE",
  "Deuxième aile (sans barre)": "LOK-AILE-SANSBARRE",
  "Combinaison opt.": "LOK-COMBINAISON-OPT",
  "Combinaison": "LOK-NEOPRENE-COMBINAISON",
  "Pack Wing gonflable": "LOK-PACK-WING-GONFLABLE",
  "Pack Wing gonflable ": "LOK-PACK-WING-GONFLABLE",
  "Pack Wing rigide": "LOK-PACK-WING-RIGIDE",
  "Pack Wing débutant": "LOK-PACK-WING-DEBUTANT",
  "Cagoule opt.": "LOK-CAGOULE-OPT",
  "Cagoule": "LOK-NEOPRENE-CAGOULE",
  "Chaussons opt.": "LOK-CHAUSSONS-OPT",
  "Chaussons": "LOK-NEOPRENE-CHAUSSONS",
  "Gants opt.": "LOK-GANTS-OPT",
  "Gants": "LOK-NEOPRENE-GANTS",
  "Harnais ceinture opt.": "LOK-HARNAIS-CEINTURE-OPT",
  "Harnais ceinture": "LOK-HARNAIS-CEINTURE",
  "Veste Néoprène opt.": "LOK-VESTENEOPRENE-OPT",
  "Veste néoprène": "LOK-NEOPRENE-VESTE",
  "Boardbag": "LOK-BOARDBAG",
  "Casque opt.": "LOK-CASQUE-OPT",
  "Casque": "LOK-PROT-CASQUE",
  "Gilet opt.": "LOK-GILET-OPT",
  "Gilet": "LOK-PROT-GILET",
  "Harnais Culotte opt.": "LOK-HARNAIS-CULOTTE-OPT",
  "Initiation foil tracté": "LOK-INITIATION-FOIL-TRACTE",
  "Barre ": "LOK-BARRE",
  "Barre": "LOK-BARRE",
  "Kitefoil ": "LOK-KITEFOIL",
  "Kitefoil": "LOK-KITEFOIL",
  "Strapless": "LOK-STRAPLESS",
  "Paddle ": "LOK-PADDLE",
  "Paddle": "LOK-PADDLE",
  "Surf ": "LOK-SURF",
  "Surf": "LOK-SURF",
  "Aile + Barre": "LOK-AILE-BARRE"
};

const HALF_DAY_PRICES = {
  'LOK-BOARDBAG-OPT': 12.50,
  'LOK-PACK-KITE': 92.50,
  'LOK-AILE-BARRE': 70.00,
  'LOK-PACK-2AILES-BARRE': 92.50,
  'LOK-BOARD-TWINTIP': 35.00,
  'LOK-WING-AILE': 55.00,
  'LOK-HARNAIS-CULOTTE': 18.75,
  'LOK-AILE-SANSBARRE': 31.25,
  'LOK-NEOPRENE-COMBINAISON': 18.75,
  'LOK-PACK-WING-GONFLABLE': 86.25,
  'LOK-NEOPRENE-CAGOULE': 6.25,
  'LOK-PACK-WING-RIGIDE': 86.25,
  'LOK-PACK-WING-DEBUTANT': 43.75,
  'LOK-WING-FOIL': 55.00,
  'LOK-WING-BOARD': 55.00,
  'LOK-WING-2AILE': 31.25,
  'LOK-CAGOULE-OPT': 6.25,
  'LOK-CHAUSSONS-OPT': 6.25,
  'LOK-GANTS-OPT': 6.25,
  'LOK-HARNAIS-CEINTURE': 18.75,
  'LOK-NEOPRENE-VESTE': 18.75,
  'LOK-NEOPRENE-CHAUSSONS': 6.25,
  'LOK-COMBINAISON-OPT': 46.25,
  'LOK-BOARDBAG': 18.75,
  'LOK-NEOPRENE-GANTS': 6.25,
  'LOK-HARNAIS-CEINTURE-OPT': 18.75,
  'LOK-PROT-CASQUE': 11.25,
  'LOK-VESTENEOPRENE-OPT': 12.50,
  'LOK-PROT-GILET': 11.25,
  'LOK-CASQUE-OPT': 6.25,
  'LOK-GILET-OPT': 6.25,
  'LOK-HARNAIS-CULOTTE-OPT': 6.25,
  'LOK-3AILE-SANSBARRE': 31.25,
  'LOK-2AILE-SANSBARRE-CS': 0,
  'LOK-3AILE-SANSBARRE-CS': 0,
  'LOK-TWINTIP-OPT-CS': 0,
  'LOK-2WING-AILE-CS': 0,
  'LOK-INITIATION-FOIL-TRACTE': 0,
  'LOK-BARRE': 36.25,
  'LOK-KITEFOIL': 73.75,
  'LOK-STRAPLESS': 48.75,
  'LOK-TWINTIP-OPT': 18.75,
  'LOK-BOARD-FOIL-WING': 67.50,
  'LOK-PADDLE': 18.75,
  'LOK-SURF': 31.25
};

const grids = {};
for (const [name, ref] of Object.entries(refsMap)) {
  grids[ref] = { 0.5: HALF_DAY_PRICES[ref] || 0 };
}

// Load all raw_prices
const files = [
  'raw_prices.txt', 'raw_prices_7_15.txt', 'raw_prices_21.txt', 
  'raw_prices_21_22.txt', 'raw_prices_28.txt', 'raw_prices_29.txt', 
  'raw_prices_30.txt', 'raw_prices_31.txt'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n').map(l => l.trim());
  let currentDay = null;
  let currentPrice = null;
  
  for (const line of lines) {
    if (!line) continue;
    let m = line.match(/^(\d+)j/);
    if (m) currentDay = parseInt(m[1]);
    m = line.match(/^pour (\d+) jour/);
    if (m) currentDay = parseInt(m[1]);
    m = line.match(/^Soit (\d+)j/);
    if (m) currentDay = parseInt(m[1]);
    
    let pm = line.match(/^(\d+(?:\.\d+)?)\s*€$/);
    if (pm) {
      currentPrice = parseFloat(pm[1]);
      continue;
    }
    
    if (currentPrice !== null && currentDay !== null) {
      let foundRef = null;
      for (const [name, ref] of Object.entries(refsMap)) {
        if (line === name) {
          foundRef = ref;
          break;
        }
      }
      if (foundRef) {
        if (!grids[foundRef][currentDay] || grids[foundRef][currentDay] === 0) {
           grids[foundRef][currentDay] = currentPrice;
        }
        currentPrice = null;
      }
    }
  }
}

for (const ref of Object.keys(grids)) {
  for (let d = 1; d <= 31; d++) {
    if (grids[ref][d] === undefined && grids[ref][d-1] !== undefined) {
      if (d === 1) grids[ref][d] = grids[ref][0.5] * 2;
      else grids[ref][d] = grids[ref][d-1];
    }
  }
}

let jsString = "const PRICING_GRIDS = {\n";
for (const ref of Object.keys(grids)) {
  let entries = Object.entries(grids[ref])
    .sort((a,b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([k,v]) => `${k}: ${v}`);
  jsString += `  '${ref}': { ${entries.join(', ')} },\n`;
}
jsString += "};\nconsole.log('done extraction');\nfs.writeFileSync('extracted_grids.js', jsString);\n";
fs.writeFileSync('extract_prices_now.js', jsString);
