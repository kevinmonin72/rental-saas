const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  // Fetch all bookings
  const res = await fetch(`${url}/rest/v1/bookings?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  let bookings = await res.json();

  if (bookings.error) {
    console.error("Error fetching bookings:", bookings);
    return;
  }

  // Sort by created_at
  bookings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const counters = {
    'ponctuel': 1,
    'wingboost': 1,
    'demi_matin': 1,
    'demi_aprem': 1
  };

  const prefixes = {
    'ponctuel': 'RP',
    'wingboost': 'RW',
    'demi_matin': 'RM',
    'demi_aprem': 'RA'
  };

  for (const b of bookings) {
    if (b.reference) continue; // Skip if already has reference
    
    const type = b.rental_type || 'ponctuel';
    const prefix = prefixes[type] || 'RX';
    if (!counters[type]) counters[type] = 1;
    
    const ref = `${prefix}${String(counters[type]).padStart(4, '0')}`;
    counters[type]++;
    
    // Update booking
    const updateRes = await fetch(`${url}/rest/v1/bookings?id=eq.${b.id}`, {
      method: 'PATCH',
      headers: { 
        'apikey': key, 
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reference: ref })
    });
    
    if (updateRes.ok) {
      console.log(`Updated ${b.id} with reference ${ref}`);
    } else {
      console.error(`Failed to update ${b.id}`, await updateRes.text());
    }
  }
  
  console.log("Backfill complete.");
}

run();
