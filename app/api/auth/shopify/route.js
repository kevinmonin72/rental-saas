import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop') || 'shop-theridery.myshopify.com';

  const clientId = '6416f25b875c33e918b0e62ebb48f6be'; // the API key the user provided
  const scopes = 'read_customers,read_orders,read_inventory,write_inventory,read_products,write_products,write_draft_orders,read_draft_orders,read_locations,read_inventory_transfers,write_inventory_transfers,write_fulfillments,read_fulfillments,write_merchant_managed_fulfillment_orders,read_merchant_managed_fulfillment_orders';
  // Note: the host URL is hardcoded here to the vercel domain for simplicity
  const redirectUri = 'https://rental-saas-seven.vercel.app/api/auth/shopify/callback';

  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${redirectUri}&state=12345`;

  return NextResponse.redirect(authUrl);
}
