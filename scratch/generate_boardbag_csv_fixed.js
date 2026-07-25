const fs = require('fs');

const products = [
  {
    reference: 'LOK-BOARDBAG',
    name: 'Boardbag',
    category: 'Accessoires',
    prices: { 
      0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 
      6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 
      12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 
      18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 
      24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 
      30: 74.98 
    }
  },
  {
    reference: 'LOK-BOARDBAG-OPT',
    name: 'Boardbag opt.',
    category: 'Accessoires',
    prices: { 
      0.5: 12.50, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 
      6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 
      12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 
      18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 
      24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 
      30: 54.98 
    }
  }
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

for (const eq of products) {
  const handle = 'location-' + eq.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const title = `Location ${eq.name.trim()}`;
  const body = `Louez votre ${eq.name.trim()} avec The Ridery.`;
  const prices = eq.prices;
  
  let isFirstVariant = true;
  const durations = Object.keys(prices).map(Number).sort((a, b) => a - b);

  for (const duration of durations) {
    const priceValue = prices[duration];
    const optionValue = duration === 0.5 ? "Demi-journée" : (duration === 1 ? "1 jour" : `${duration} jours`);
    
    const row = [
      handle, // Handle
      isFirstVariant ? `"${title}"` : "", // Title
      isFirstVariant ? `"${body}"` : "", // Body (HTML)
      isFirstVariant ? "The Ridery" : "", // Vendor
      isFirstVariant ? "Location" : "", // Type
      isFirstVariant ? `"Location, ${eq.category}"` : "", // Tags
      isFirstVariant ? "TRUE" : "", // Published
      isFirstVariant ? "Durée" : "", // Option1 Name (MUST be empty on subsequent variants!)
      optionValue, // Option1 Value
      eq.reference, // Variant SKU
      "0", // Variant Grams
      "", // Variant Inventory Tracker (empty = don't track)
      "", // Variant Inventory Qty
      "deny", // Variant Inventory Policy
      "manual", // Variant Fulfillment Service
      priceValue.toFixed(2), // Variant Price
      "", // Variant Compare At Price
      "FALSE", // Variant Requires Shipping
      "TRUE", // Variant Taxable
      "", // Variant Barcode
      "", // Image Src
      "", // Image Position
      "", // Image Alt Text
      isFirstVariant ? "FALSE" : "", // Gift Card (MUST be empty on subsequent variants!)
      isFirstVariant ? `"${title}"` : "", // SEO Title
      isFirstVariant ? `"${body}"` : "", // SEO Description
      isFirstVariant ? "active" : "" // Status (MUST be empty on subsequent variants!)
    ];
    
    csvContent += row.join(',') + '\n';
    isFirstVariant = false;
  }
}

const desktopPath = '/Users/kevinmonin/Desktop/location_boardbag_shopify.csv';
fs.writeFileSync(desktopPath, csvContent, 'utf-8');
console.log(`Fixed CSV created successfully at ${desktopPath}`);
