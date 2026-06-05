const fs = require('fs');

const pagePath = 'app/invoice/page.js';
let code = fs.readFileSync(pagePath, 'utf8');

// Extract the PRICING_GRIDS object using eval or regex
const gridMatch = code.match(/const PRICING_GRIDS = (\{[\s\S]*?\});/);
let grids = {};
if (gridMatch) {
  // Safe eval since we know the format
  grids = eval('(' + gridMatch[1] + ')');
}

const file2 = fs.readFileSync('raw_prices_7_15.txt', 'utf8');

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

const chunks = file2.split(/logo-lokki-solutions/);

for (let idx = 1; idx < chunks.length; idx++) {
  const d = idx + 6; // chunk 1 is day 7, etc.
  const lines = chunks[idx].split('\n');
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
        
        if (grids[ref][d] === undefined || (grids[ref][d] === 0 && currentPrice > 0) || currentPrice > 0) {
           grids[ref][d] = currentPrice;
        }
        currentPrice = null;
      }
    }
  }
}

// Ensure and extrapolate
for (const ref of Object.keys(grids)) {
  let extrapolated = grids[ref];
  
  // Safety fill 1-15
  for(let d = 1; d <= 15; d++) {
    if(extrapolated[d] === undefined && extrapolated[d-1] !== undefined) {
       extrapolated[d] = extrapolated[d-1]; 
    }
  }
  
  // Extrapolate 16-31
  if (extrapolated[14] !== undefined && extrapolated[15] !== undefined) {
    const dailyInc = extrapolated[15] - extrapolated[14];
    for (let d = 16; d <= 31; d++) {
      extrapolated[d] = Math.round((extrapolated[d-1] + dailyInc) * 100) / 100;
    }
  }
}

let jsString = "const PRICING_GRIDS = {\n";
for (const [ref, daysObj] of Object.entries(grids)) {
  let daysStr = Object.entries(daysObj).sort((a,b) => parseFloat(a[0]) - parseFloat(b[0]))
    .map(([d, p]) => `${d}: ${p}`).join(", ");
  jsString += `    '${ref}': { ${daysStr} },\n`;
}
jsString += "  }";

// Replace in code
code = code.replace(/const PRICING_GRIDS = \{[\s\S]*?\};\n/, jsString + ";\n");

fs.writeFileSync(pagePath, code);
