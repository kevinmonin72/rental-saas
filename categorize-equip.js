const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
  const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();

  let allData = [];
  let from = 0;
  const limit = 1000;
  let hasMore = true;

  while (hasMore) {
    const res = await fetch(`${url}/rest/v1/equipment?select=id,name,reference,category`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const data = await res.json();
    if (data && data.length > 0) {
      allData = [...allData, ...data];
      from += limit;
      if (data.length < limit) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  const categorize = (name, ref) => {
    const s = (name + ' ' + (ref || '')).toLowerCase();
    
    if (s.includes('kite') || s.includes('twintip') || s.includes('barre') || s.includes('twin-tip')) return 'Kitesurf';
    if (s.includes('wing') || s.includes('foil') || s.includes('platine') || s.includes('avion') || s.includes('strike') || s.includes('origin') || s.includes('slick') || s.includes('unit') || s.includes('board')) return 'Wingfoil';
    if (s.includes('surf') || s.includes('paddle') || s.includes('sup')) return 'Autres';
    if (s.includes('harnais') || s.includes('boardbag') || s.includes('casque') || s.includes('gilet') || s.includes('pompe')) return 'Accessoires';
    if (s.includes('combinaison') || s.includes('combi') || s.includes('neoprene') || s.includes('chausson') || s.includes('cagoule') || s.includes('gant')) return 'Néoprène';
    
    if (s.includes('f-one') || s.includes('duotone') || s.includes('neilpryde') || s.includes('cabrinha')) {
       if (s.includes('evo') || s.includes('dice') || s.includes('rebel') || s.includes('bandit')) return 'Kitesurf';
       if (s.includes('slick') || s.includes('unit') || s.includes('fly') || s.includes('phantom')) return 'Wingfoil';
    }
    
    return 'Autres';
  };

  let count = 0;
  for (const e of allData) {
    if (!e.category || e.category === '') {
      const newCat = categorize(e.name, e.reference);
      await fetch(`${url}/rest/v1/equipment?id=eq.${e.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ category: newCat })
      });
      count++;
    }
  }
  
  console.log(`Updated ${count} items.`);
}

run();
