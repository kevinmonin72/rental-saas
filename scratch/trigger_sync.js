async function run() {
  console.log("Triggering shopify sync locally...");
  try {
    const res = await fetch('http://localhost:3002/api/sync/shopify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'inventory' })
    });
    
    const data = await res.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Error triggering sync:", err);
  }
}
run();
