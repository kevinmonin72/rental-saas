const fs = require('fs');
const readline = require('readline');

async function parsePrices() {
  const fileStream = fs.createReadStream('/Users/kevinmonin/.gemini/antigravity-cli/brain/c7fe1c7d-87ea-4366-bb38-e7f60b9bfad6/.system_generated/logs/transcript.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let latestMsg = "";
  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes("pour 1 jour logo-lokki-solutions")) {
      latestMsg = obj.content;
    }
  }

  // Define reference mapping
  const refsMap = {
    "Boardbag opt.": "LOK-BOARDBAG-OPT",
    "Pack Kitesurf - à personnaliser ✨": "LOK-PACK-KITE",
    "Pack 2 Ailes + Barre": "LOK-PACK-2AILES-BARRE",
    "Aile + Barre": "LOK-AILE-BARRE", // Careful: duplicate below
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
    "Surf": "LOK-SURF"
  };

  const grids = {};
  for (let ref of Object.values(refsMap)) {
    grids[ref] = {};
  }

  // We split the message into chunks for each day
  const chunks = latestMsg.split(/pour 1 jour|2j\n|3j\n|4j\n|5j\n|6j\n/);
  // chunks[0] is empty, chunks[1] is day 1, chunks[2] is day 2, etc.
  
  for (let d = 1; d <= 6; d++) {
    if (!chunks[d]) continue;
    const lines = chunks[d].split('\n');
    let currentPrice = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const priceMatch = line.match(/^(\d+(?:\.\d+)?)\s*€$/);
      if (priceMatch) {
        currentPrice = parseFloat(priceMatch[1]);
      } else if (currentPrice !== null) {
        // we check if this line is an exact match for one of the names
        let found = false;
        for (const [name, ref] of Object.entries(refsMap)) {
          if (line === name || line === name + " ") {
            grids[ref][d] = currentPrice;
            currentPrice = null;
            found = true;
            break;
          }
        }
      }
    }
  }

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

  for (const [ref, price] of Object.entries(HALF_DAY_PRICES)) {
    if (!grids[ref]) grids[ref] = {};
    grids[ref][0.5] = price;
  }
  
  // Format to match PRICING_GRIDS exactly
  let jsString = "  const PRICING_GRIDS = {\n";
  for (const [ref, daysObj] of Object.entries(grids)) {
    // Fill out to 31 days using day 6 as a flat daily increment
    // Let's extrapolate: day N = day 6 + (N-6) * (day 6 - day 5)
    // Actually, lokki pricing typically tapers off, let's just extrapolate the daily rate after 6 days 
    // Or we just repeat the last day's difference!
    let extrapolated = { ...daysObj };
    if (extrapolated[5] && extrapolated[6]) {
      const dailyInc = extrapolated[6] - extrapolated[5];
      for (let d = 7; d <= 31; d++) {
        extrapolated[d] = Math.round((extrapolated[d-1] + dailyInc) * 100) / 100;
      }
    }
    
    let daysStr = Object.entries(extrapolated).sort((a,b) => parseFloat(a[0]) - parseFloat(b[0]))
      .map(([d, p]) => `${d}: ${p}`).join(", ");
    jsString += `    '${ref}': { ${daysStr} },\n`;
  }
  jsString += "  };\n";
  
  fs.writeFileSync('grids.js', jsString);
  console.log("Done generating grids.");
}

parsePrices();
