const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function main() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  const url = `https://${domain}/admin/oauth/access_scopes.json`;
  const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } });
  const data = await res.json();
  console.log("Active access scopes:");
  if (data.access_scopes) {
    data.access_scopes.forEach(s => {
      console.log(`- ${s.handle}`);
    });
  } else {
    console.log(data);
  }
}

main().catch(console.error);
