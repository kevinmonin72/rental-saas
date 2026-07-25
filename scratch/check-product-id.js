require('dotenv').config({ path: '.env.local' });

async function checkId(id) {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const url = `https://${domain}/admin/api/2024-01/products/${id}.json`;
  
  try {
    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
    if (!res.ok) {
      console.log(`Failed to fetch product ${id}`);
      return;
    }
    const data = await res.json();
    console.log(`Product ID ${id} handle:`, data.product.handle);
    console.log(`Product SKU:`, data.product.variants.map(v => v.sku));
  } catch (err) {
    console.error(err);
  }
}

checkId('15794001445195');
