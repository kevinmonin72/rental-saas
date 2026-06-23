const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fetchAllOrders() {
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const domain = process.env.SHOPIFY_STORE_DOMAIN;

  if (!token || !domain) {
    console.error("Missing Shopify credentials in environment variables.");
    process.exit(1);
  }

  // Shopify Orders REST API
  // We filter since 2026-01-01
  let url = `https://${domain}/admin/api/2024-01/orders.json?status=any&created_at_min=2026-01-01T00:00:00Z&limit=250`;
  let allOrders = [];
  let page = 1;

  console.log("Fetching orders starting from 2026-01-01...");

  while (url) {
    console.log(`Fetching page ${page}...`);
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': token
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error fetching page ${page}:`, res.status, errText);
      break;
    }

    const data = await res.json();
    if (data.orders && data.orders.length > 0) {
      allOrders = allOrders.concat(data.orders);
      console.log(`Retrieved ${data.orders.length} orders (Total so far: ${allOrders.length})`);
    } else {
      console.log("No orders found in this page.");
    }

    // Check pagination
    const linkHeader = res.headers.get('link');
    if (linkHeader && linkHeader.includes('rel="next"')) {
      const match = linkHeader.match(/<([^>]+)>; rel="next"/);
      url = match ? match[1] : null;
      page++;
    } else {
      url = null;
    }
  }

  console.log(`\nFinished fetching. Total orders retrieved: ${allOrders.length}`);
  return allOrders;
}

async function main() {
  const orders = await fetchAllOrders();
  
  // Filter orders
  // 1. Order total price >= 100
  // 2. Contains "wingboost" or "wingbooste" in line items (case insensitive)
  const filteredOrders = [];

  for (const order of orders) {
    const totalPrice = parseFloat(order.total_price);
    
    // Check for wingboost in line items
    const wingboostItems = [];
    for (const item of order.line_items || []) {
      const titleLower = String(item.title).toLowerCase();
      if (titleLower.includes('wingboost')) {
        wingboostItems.push(item);
      }
    }

    if (wingboostItems.length > 0) {
      // It has wingboost items
      if (totalPrice >= 100) {
        filteredOrders.push({
          order_id: order.id,
          order_number: order.name,
          created_at: order.created_at,
          total_price: totalPrice,
          currency: order.currency,
          customer_email: order.customer?.email || order.email || 'N/A',
          customer_name: order.customer ? `${order.customer.first_name || ''} ${order.customer.last_name || ''}`.trim() : 'N/A',
          wingboost_items: wingboostItems.map(item => `${item.title} (x${item.quantity}) - ${item.price} ${order.currency}`),
          original_order: order // keep reference if needed
        });
      }
    }
  }

  console.log(`\nFound ${filteredOrders.length} orders matching criteria.`);
  
  // Print results
  filteredOrders.forEach((o, index) => {
    console.log(`\n--- Match ${index + 1} ---`);
    console.log(`Order: ${o.order_number} (${o.order_id})`);
    console.log(`Date: ${o.created_at}`);
    console.log(`Customer: ${o.customer_name} (${o.customer_email})`);
    console.log(`Total Price: ${o.total_price} ${o.currency}`);
    console.log(`Wingboost Items:`, o.wingboost_items);
  });

  // Save results to a json file in scratch
  const fs = require('fs');
  fs.writeFileSync(
    path.join(__dirname, 'wingboost_orders.json'),
    JSON.stringify(filteredOrders, null, 2)
  );
  console.log("\nResults saved to scratch/wingboost_orders.json");
}

main().catch(err => {
  console.error("Fatal error:", err);
});
