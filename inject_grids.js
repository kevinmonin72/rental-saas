const fs = require('fs');

const pagePath = 'app/invoice/page.js';
let code = fs.readFileSync(pagePath, 'utf8');

const gridsCode = fs.readFileSync('grids.js', 'utf8');

// Replace HALF_DAY_PRICES with PRICING_GRIDS
const halfDayPricesRegex = /const HALF_DAY_PRICES = \{[\s\S]*?\};\n/;
code = code.replace(halfDayPricesRegex, gridsCode + "\n");

// Update pricing logic
const oldPricingLogic = `
                if (days === 0.5 && HALF_DAY_PRICES[ref] !== undefined) {
                  finalPrice = HALF_DAY_PRICES[ref];
                } else if (days > 1) {
                  // For normal calculation logic (can be refined later for lokki grids)
                  finalPrice = finalPrice * days;
                }`;

const newPricingLogic = `
                // Try to find price from grid
                if (PRICING_GRIDS[ref] && PRICING_GRIDS[ref][days] !== undefined) {
                  finalPrice = PRICING_GRIDS[ref][days];
                } else if (days !== 1) {
                  // Fallback
                  if (days === 0.5) finalPrice = finalPrice * 0.5;
                  else finalPrice = finalPrice * days;
                }`;

if (code.includes('if (days === 0.5 && HALF_DAY_PRICES[ref] !== undefined) {')) {
  // It's a bit hard to replace exactly due to whitespace, let's use a regex
  code = code.replace(/if\s*\(days\s*===\s*0\.5\s*&&\s*HALF_DAY_PRICES\[ref\]\s*!==\s*undefined\)\s*\{[\s\S]*?finalPrice\s*=\s*finalPrice\s*\*\s*days;\s*\}/, newPricingLogic.trim());
}

fs.writeFileSync(pagePath, code);
