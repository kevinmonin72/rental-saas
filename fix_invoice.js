const fs = require('fs');
let code = fs.readFileSync('app/invoice/page.js', 'utf8');

// Fix the LOK-TWINTIP-OPT line
code = code.replace(
  /'LOK-TWINTIP-OPT': \{ 0.5: 15.*? const addEqToInvoice = async \(eq\) => \{/s,
  `'LOK-TWINTIP-OPT': { 0.5: 15, 1: 20, 2: 35, 3: 45, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 50, 10: 60, 11: 60, 12: 60, 13: 60, 14: 60, 15: 60, 16: 60, 17: 60, 18: 60, 19: 60, 20: 60, 21: 60, 22: 60, 23: 60, 24: 60, 25: 60, 26: 60, 27: 60, 28: 50, 29: 50, 30: 50, 31: 50 }
  };

  const addEqToInvoice = async (eq) => {`
);

// Fix the setQuickRef(''); setSearchResults([]); return; } at the end of addEqToInvoice
code = code.replace(
  /ickRef\(''\);\n      setSearchResults\(\[\]\);\n      return;\n    \}/s,
  ` `
);

fs.writeFileSync('app/invoice/page.js', code);
