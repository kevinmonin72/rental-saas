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
  const targetUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${path}${url.search}`;

  // 3. Forward request with Service Role Key to bypass RLS
  const proxyHeaders = new Headers();
  proxyHeaders.set('apikey', process.env.SUPABASE_SERVICE_ROLE_KEY);
  proxyHeaders.set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  
  if (req.headers.has('Content-Type')) proxyHeaders.set('Content-Type', req.headers.get('Content-Type'));
  if (req.headers.has('Accept')) proxyHeaders.set('Accept', req.headers.get('Accept'));
  if (req.headers.has('Prefer')) proxyHeaders.set('Prefer', req.headers.get('Prefer'));

  const options = {
    method: req.method,
    headers: proxyHeaders,
    body: req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined,
    cache: 'no-store'
  };

  console.log('Proxy target:', targetUrl);
  console.log('Proxy options:', { method: options.method, headers: Array.from(options.headers.entries()) });

  const response = await fetch(targetUrl, options);
  console.log('Proxy response status:', response.status);
  const data = await response.text();
  console.log('Proxy response data length:', data.length);

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
