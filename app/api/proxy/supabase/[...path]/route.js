import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const getSecretKey = () => new TextEncoder().encode(process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure');

async function handleProxy(req, { params }) {
  // 1. Verify Admin (cookies() is async in Next 15+)
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;
  if (!sessionToken) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (payload.role !== 'admin') throw new Error('Not admin');
  } catch (err) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Build target
  const path = (await params).path.join('/');
  const url = new URL(req.url);
  const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${path}${url.search}`;

  // 3. Simple headers
  const proxyHeaders = new Headers();
  proxyHeaders.set('apikey', process.env.SUPABASE_SERVICE_ROLE_KEY);
  proxyHeaders.set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  
  const options = {
    method: req.method,
    headers: proxyHeaders,
    cache: 'no-store'
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    options.body = await req.text();
    proxyHeaders.set('Content-Type', 'application/json');
    proxyHeaders.set('Prefer', 'return=representation');
  }

  try {
    const response = await fetch(targetUrl, options);
    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
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
