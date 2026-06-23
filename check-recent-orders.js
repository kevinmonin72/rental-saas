require('dotenv').config({ path: '.env.local' });
async function main() {
  const url = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2024-01/orders.json?status=any&limit=3`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
  });
  const data = await res.json();
  console.log(JSON.stringify(data.orders.map(o => ({
    id: o.id,
    name: o.name,
    email: o.email,
    created_at: o.created_at,
    items: o.line_items.map(i => ({ title: i.title, sku: i.sku }))
  })), null, 2));
}
main();
