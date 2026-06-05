import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure');

async function handleProxy(req, { params }) {
  // 1. Check admin auth securely
  const sessionToken = cookies().get('admin_session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (payload.role !== 'admin') throw new Error('Not admin');
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Build target URL
  const path = params.path.join('/');
  const url = new URL(req.url);
  const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${path}${url.search}`;

  // 3. Forward request with Service Role Key to bypass RLS
  const headers = new Headers(req.headers);
  headers.set('apikey', process.env.SUPABASE_SERVICE_ROLE_KEY);
  headers.set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  // Important to remove host so fetch computes it from targetUrl
  headers.delete('host');
  // Remove origin to prevent CORS conflicts from Supabase API
  headers.delete('origin');
  headers.delete('referer');

  const options = {
    method: req.method,
    headers,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    cache: 'no-store'
  };

  const response = await fetch(targetUrl, options);
  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json'
    }
  });
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
