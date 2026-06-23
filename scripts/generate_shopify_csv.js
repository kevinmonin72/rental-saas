const fs = require('fs');

// The catalog array from lib/catalog.js
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

const headers = [
  "Handle",
  "Title",
  "Body (HTML)",
  "Vendor",
  "Type",
  "Tags",
  "Published",
  "Option1 Name",
  "Option1 Value",
  "Variant SKU",
  "Variant Grams",
  "Variant Inventory Tracker",
  "Variant Inventory Qty",
  "Variant Inventory Policy",
  "Variant Fulfillment Service",
  "Variant Price",
  "Variant Compare At Price",
  "Variant Requires Shipping",
  "Variant Taxable",
  "Variant Barcode",
  "Image Src",
  "Image Position",
  "Image Alt Text",
  "Gift Card",
  "SEO Title",
  "SEO Description",
  "Status"
];

let csvContent = headers.join(',') + '\n';

for (const eq of GENERIC_EQUIPMENTS) {
  const handle = 'location-' + eq.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const title = `Location ${eq.name.trim()}`;
  const body = `Louez votre ${eq.name.trim()} avec The Ridery.`;
  
  const row = [
    handle, // Handle
    `"${title}"`, // Title
    `"${body}"`, // Body (HTML)
    "The Ridery", // Vendor
    "Location", // Type
    `"Location, ${eq.category}"`, // Tags
    "TRUE", // Published
    "Title", // Option1 Name
    "Default Title", // Option1 Value
    eq.reference, // Variant SKU
    "0", // Variant Grams
    "shopify", // Variant Inventory Tracker
    "100", // Variant Inventory Qty
    "continue", // Variant Inventory Policy
    "manual", // Variant Fulfillment Service
    "0.00", // Variant Price (usually pricing is handled by the widget/SaaS)
    "", // Variant Compare At Price
    "FALSE", // Variant Requires Shipping
    "TRUE", // Variant Taxable
    "", // Variant Barcode
    "", // Image Src
    "", // Image Position
    "", // Image Alt Text
    "FALSE", // Gift Card
    `"${title}"`, // SEO Title
    `"${body}"`, // SEO Description
    "active" // Status
  ];
  
  csvContent += row.join(',') + '\n';
}

fs.writeFileSync('/Users/kevinmonin/rental-saas/shopify_rental_products.csv', csvContent, 'utf-8');
console.log("CSV created successfully!");
