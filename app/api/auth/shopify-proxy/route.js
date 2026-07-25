import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

function verifyShopifyProxySignature(searchParams, clientSecret) {
  const signature = searchParams.get('signature');
  if (!signature) return false;

  const params = {};
  searchParams.forEach((value, key) => {
    if (key !== 'signature') {
      params[key] = value;
    }
  });

  const sortedKeys = Object.keys(params).sort();
  const inputString = sortedKeys
    .map(key => `${key}=${params[key]}`)
    .join('');

  const calculatedSignature = crypto
    .createHmac('sha256', clientSecret)
    .update(inputString)
    .digest('hex');

  return calculatedSignature === signature;
}

export async function GET(request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const shop = searchParams.get('shop') || 'shop-theridery.myshopify.com';
    const path_prefix = searchParams.get('path_prefix') || '/apps/espace-client';
    const loggedInCustomerId = searchParams.get('logged_in_customer_id');

    // 1. Signature Verification
    // Custom Apps use the Shopify API Secret Key (which is also SHOPIFY_WEBHOOK_SECRET)
    const clientSecret = process.env.SHOPIFY_API_SECRET_KEY || process.env.SHOPIFY_WEBHOOK_SECRET;
    
    if (!clientSecret) {
      console.error('Missing Shopify App Client Secret (SHOPIFY_API_SECRET_KEY / SHOPIFY_WEBHOOK_SECRET).');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    const isValid = verifyShopifyProxySignature(searchParams, clientSecret);
    
    if (!isValid) {
      console.error('Shopify App Proxy invalid signature.');
      // Redirect to standard login space with error parameter
      return NextResponse.redirect(new URL('/espace-client?error=invalid_signature', request.url));
    }

    // 2. Check if the customer is logged in on Shopify
    if (!loggedInCustomerId) {
      // If the customer is not logged in, redirect them to the Shopify store login page
      // Shopify will log them in and then redirect them back to the proxy URL
      const redirectUrl = `https://${shop}/account/login?checkout_url=${path_prefix}`;
      console.log('Customer not logged in on Shopify. Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    }

    // 3. Fetch Customer info from Shopify API using access token
    const shopifyAccessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    if (!shopifyAccessToken) {
      console.error('Missing SHOPIFY_ACCESS_TOKEN.');
      return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
    }

    console.log(`Fetching customer details for Shopify ID: ${loggedInCustomerId}`);
    const shopifyCustomerUrl = `https://${shop}/admin/api/2024-04/customers/${loggedInCustomerId}.json`;
    
    const customerRes = await fetch(shopifyCustomerUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': shopifyAccessToken,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });

    if (!customerRes.ok) {
      console.error(`Failed to fetch Shopify customer details for ID ${loggedInCustomerId}:`, await customerRes.text());
      return NextResponse.redirect(new URL('/espace-client?error=customer_not_found', request.url));
    }

    const { customer } = await customerRes.json();
    const email = customer.email?.trim().toLowerCase();

    if (!email) {
      console.error(`Shopify customer with ID ${loggedInCustomerId} has no email address.`);
      return NextResponse.redirect(new URL('/espace-client?error=no_email', request.url));
    }

    console.log(`Shopify customer authenticated: ${email}`);

    // 4. Synchronize or create the customer in our Supabase "customers" table
    // Construct address string
    let addressStr = '';
    if (customer.default_address) {
      const addr = customer.default_address;
      addressStr = [
        addr.address1,
        addr.address2,
        addr.zip,
        addr.city,
        addr.country
      ].filter(Boolean).join(', ');
    }

    // Query if customer exists in public.customers table
    const { data: existingCust, error: fetchErr } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching existing customer from DB:', fetchErr.message);
    }

    const phoneValue = customer.phone || '';
    const firstNameValue = customer.first_name || '';
    const lastNameValue = customer.last_name || '';

    if (existingCust) {
      // Update details to sync from Shopify
      console.log(`Updating existing customer in database: ${email}`);
      const { error: updateErr } = await supabaseAdmin
        .from('customers')
        .update({
          first_name: firstNameValue,
          last_name: lastNameValue,
          phone: phoneValue,
          address: addressStr
        })
        .eq('id', existingCust.id);
      
      if (updateErr) {
        console.error('Error updating customer record:', updateErr.message);
      }
    } else {
      // Insert new customer record
      console.log(`Creating new customer in database: ${email}`);
      const newId = crypto.randomUUID();
      const { error: insertErr } = await supabaseAdmin
        .from('customers')
        .insert([{
          id: newId,
          email: email,
          first_name: firstNameValue,
          last_name: lastNameValue,
          phone: phoneValue,
          address: addressStr
        }]);

      if (insertErr) {
        console.error('Error inserting customer record:', insertErr.message);
      }
    }

    // 5. Generate a Supabase sign-in/magic link
    // The redirect URL should lead to the client space dashboard
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
    const redirectToUrl = `${siteUrl}/espace-client`;
    
    console.log(`Generating auto-login link for email ${email} redirecting to ${redirectToUrl}`);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectToUrl
      }
    });

    if (linkError) {
      console.error('Error generating Supabase login link:', linkError.message);
      return NextResponse.redirect(new URL('/espace-client?error=link_generation_failed', request.url));
    }

    // Redirect the browser to the action link which logs them in and forwards them to /espace-client
    const actionLink = linkData.properties.action_link;
    console.log(`Success! Redirecting user to action link: ${actionLink}`);
    return NextResponse.redirect(actionLink);

  } catch (error) {
    console.error('Shopify Proxy Authentication Route Error:', error);
    return NextResponse.redirect(new URL('/espace-client?error=internal_server_error', request.url));
  }
}
