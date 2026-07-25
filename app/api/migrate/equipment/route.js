import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ONE-TIME MIGRATION: Add shopify_rental_sku column to equipment table
export async function GET(req) {
  const secret = req.headers.get('x-migrate-secret');
  if (secret !== 'migrate-2k26-theridery') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Try to add column by doing an UPDATE with the new field — this won't work for DDL
  // Instead, try to use PostgREST's execute endpoint
  try {
    const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: 'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS shopify_rental_sku TEXT;' }),
    });

    if (!res.ok) {
      const err = await res.json();
      // If function doesn't exist, check if column already exists
      const checkRes = await fetch(`${url}/rest/v1/equipment?select=shopify_rental_sku&limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });

      if (checkRes.ok) {
        return NextResponse.json({ message: 'Column already exists' });
      }

      return NextResponse.json({
        error: 'Cannot run migration automatically.',
        manual_sql: 'ALTER TABLE equipment ADD COLUMN IF NOT EXISTS shopify_rental_sku TEXT;',
        supabase_dashboard: 'https://supabase.com/dashboard/project/amfacpwujrkhpspihdrx/editor',
        details: err
      }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
