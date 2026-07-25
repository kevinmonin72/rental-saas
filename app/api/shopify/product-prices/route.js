import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;

  if (!domain || !token) {
    return NextResponse.json({ prices: {} });
  }

  const query = `{
    products(first: 250) {
      edges {
        node {
          variants(first: 50) {
            edges {
              node {
                sku
                price
              }
            }
          }
        }
      }
    }
  }`;

  try {
    const res = await fetch(`https://${domain}/admin/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify({ query }),
      cache: 'no-store',
    });

    if (!res.ok) return NextResponse.json({ prices: {} });

    const { data } = await res.json();
    const prices = {};

    for (const { node: product } of (data?.products?.edges || [])) {
      for (const { node: variant } of (product?.variants?.edges || [])) {
        if (variant.sku && variant.price) {
          prices[variant.sku] = parseFloat(variant.price);
        }
      }
    }

    return NextResponse.json({ prices });
  } catch {
    return NextResponse.json({ prices: {} });
  }
}
