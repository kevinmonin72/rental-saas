import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!domain || !token) {
      console.error('Shopify configuration is missing.');
      return NextResponse.json({ orders: [] }); // Fail gracefully
    }

    // 1. Search for the customer by email
    const searchUrl = `https://${domain}/admin/api/2024-04/customers/search.json?query=email:${encodeURIComponent(email)}`;
    
    const searchRes = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      cache: 'no-store',
    });

    if (!searchRes.ok) {
      console.error('Failed to search Shopify customer:', await searchRes.text());
      return NextResponse.json({ orders: [] });
    }

    const searchData = await searchRes.json();
    
    if (!searchData.customers || searchData.customers.length === 0) {
      // Customer not found in Shopify
      return NextResponse.json({ orders: [] });
    }

    const customerId = searchData.customers[0].id;

    // 2. Fetch the customer's orders
    const ordersUrl = `https://${domain}/admin/api/2024-04/customers/${customerId}/orders.json?status=any`;
    
    const ordersRes = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      cache: 'no-store',
    });

    if (!ordersRes.ok) {
      console.error('Failed to fetch Shopify orders:', await ordersRes.text());
      return NextResponse.json({ orders: [] });
    }

    const ordersData = await ordersRes.json();
    
    // Map to a clean format
    const cleanedOrders = (ordersData.orders || []).map(order => ({
      id: order.id,
      name: order.name,
      created_at: order.created_at,
      total_price: order.total_price,
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      order_status_url: order.order_status_url,
      line_items: order.line_items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku
      }))
    }));

    return NextResponse.json({ orders: cleanedOrders });

  } catch (error) {
    console.error('Shopify API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', orders: [] }, { status: 500 });
  }
}
