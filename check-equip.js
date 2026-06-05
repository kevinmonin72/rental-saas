const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  const res = await fetch(`${url}/rest/v1/equipment?select=*&limit=5`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const equip = await res.json();
  console.log(equip);
}

run();
