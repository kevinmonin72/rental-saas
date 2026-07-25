import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure');

async function handleProxy(req, { params }) {
  // 1. Verify Admin — accept cookie OR X-Admin-Token header (for iframe clients where cookies are blocked)
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value
    || cookieStore.get('admin_session_p')?.value
    || req.headers.get('X-Admin-Token');
  if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (payload.role !== 'admin') throw new Error('Not admin');
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Build target
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('CRITICAL: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    return NextResponse.json({ error: 'Server misconfiguration: Supabase env vars missing' }, { status: 503 });
  }

  const path = (await params).path.join('/');
  const url = new URL(req.url);
  const targetUrl = `${supabaseUrl}/${path}${url.search}`;

  // 3. Simple headers
  const proxyHeaders = new Headers();
  proxyHeaders.set('apikey', serviceKey);
  proxyHeaders.set('Authorization', `Bearer ${serviceKey}`);
  
  if (req.headers.has('prefer')) proxyHeaders.set('Prefer', req.headers.get('prefer'));
  if (req.headers.has('range')) proxyHeaders.set('Range', req.headers.get('range'));
  if (req.headers.has('range-unit')) proxyHeaders.set('Range-Unit', req.headers.get('range-unit'));

  const options = {
    method: req.method,
    headers: proxyHeaders,
    cache: 'no-store'
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = await req.text();
    proxyHeaders.set('Content-Type', 'application/json');
    if (!proxyHeaders.has('Prefer')) {
      proxyHeaders.set('Prefer', 'return=representation');
    }
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.text();
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'application/json');
    if (response.headers.has('content-range')) {
      responseHeaders.set('Content-Range', response.headers.get('content-range'));
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
