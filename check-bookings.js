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

  const wingboosts = bookings.filter(b => b.rental_type === 'wingboost');
  console.log(`Total wingboosts: ${wingboosts.length}`);
  
  wingboosts.forEach(b => {
    console.log(`- ${b.id} | start: ${b.start_date} | end: ${b.end_date} | status: ${b.status}`);
  });
}

run();
