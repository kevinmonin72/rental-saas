const fs = require('fs');

const pagePath = 'app/invoice/page.js';
let code = fs.readFileSync(pagePath, 'utf8');

const gridMatch = code.match(/const PRICING_GRIDS = (\{[\s\S]*?\});/);
let grids = {};
if (gridMatch) {
  grids = eval('(' + gridMatch[1] + ')');
}

const fileText = fs.readFileSync('raw_prices_31.txt', 'utf8');

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
  "Barre": "LOK-BARRE",
  "Kitefoil": "LOK-KITEFOIL",
  "Strapless": "LOK-STRAPLESS",
  "Paddle": "LOK-PADDLE",
  "Surf": "LOK-SURF",
  "Aile + Barre": "LOK-AILE-BARRE"
};

const d = 31;
const lines = fileText.split('\n');
let currentPrice = null;

for (let i = 0; i < lines.length; i++) {
  let line = lines[i].trim();
  if (!line) continue;

  const priceMatch = line.match(/^(\d+(?:\.\d+)?)\s*€$/);
  if (priceMatch) {
    currentPrice = parseFloat(priceMatch[1]);
  } else if (currentPrice !== null) {
    let foundName = null;
    for (const name of Object.keys(refsMap)) {
      if (line === name || line === name + " " || line === name + " ✨") {
        foundName = name;
        break;
      }
    }
    
    if (foundName) {
      const ref = refsMap[foundName];
      if (!grids[ref]) grids[ref] = {};
      
      if (currentPrice > 0 || ref.includes('-CS') || ref.includes('INITIATION')) {
         grids[ref][d] = currentPrice;
      } else {
         grids[ref][d] = grids[ref][d-1];
      }
      currentPrice = null;
    }
  }
}

let jsString = "  const PRICING_GRIDS = {\n";
for (const [ref, daysObj] of Object.entries(grids)) {
  let daysStr = Object.entries(daysObj).sort((a,b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([d, p]) => `${d}: ${p}`).join(", ");
  jsString += `    '${ref}': { ${daysStr} },\n`;
}
jsString += "  };\n";

code = code.replace(/  const PRICING_GRIDS = \{[\s\S]*?\};\n/, jsString);

fs.writeFileSync(pagePath, code);
