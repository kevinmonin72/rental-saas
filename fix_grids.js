const fs = require('fs');

const pagePath = 'app/invoice/page.js';
let code = fs.readFileSync(pagePath, 'utf8');

// The old PRICING_GRIDS was right after the place where I injected.
// Let's remove the second PRICING_GRIDS.
const parts = code.split('const PRICING_GRIDS = {');
if (parts.length > 2) {
  // parts[0] is everything before the first one (my injected one).
  // parts[1] is my injected one until the second 'const PRICING_GRIDS = {'
  // parts[2] is the old one. We need to remove parts[2] up to its closing bracket.
  
  // Actually it's easier to just read the file, locate the old one and replace it.
  // The old one had: 'LOK-PACK-KITE': { 0.5: 74, 1: 79, ... }
  // Let's replace the whole old block with an empty string.
  const oldGridRegex = /const PRICING_GRIDS = \{[\s\S]*?'LOK-PACK-KITE': \{ 0\.5: 74[\s\S]*?\};\n/;
  code = code.replace(oldGridRegex, '');
  fs.writeFileSync(pagePath, code);
  console.log("Removed old PRICING_GRIDS");
}
