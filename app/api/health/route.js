import { NextResponse } from 'next/server';

const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_PASSWORD',
];

export const dynamic = 'force-dynamic';

export async function GET() {
  const missing = REQUIRED_ENV_VARS.filter(k => !process.env[k]);

  if (missing.length > 0) {
    console.error('HEALTH CHECK FAILED — missing env vars:', missing);
    return NextResponse.json(
      { status: 'error', missing },
      { status: 503 }
    );
  }

  // Quick Supabase connectivity check
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bookings?select=count&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'count=exact',
        },
      }
    );
    if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
  } catch (e) {
    return NextResponse.json({ status: 'error', supabase: e.message }, { status: 503 });
  }

  return NextResponse.json({ status: 'ok' });
}
