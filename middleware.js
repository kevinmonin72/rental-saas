import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// We must redefine the getSecretKey here since jose needs to be imported directly in middleware
// Edge functions don't support some Node APIs if they were in lib/auth.js
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return new TextEncoder().encode(secret);
};

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Paths that are explicitly public or don't need auth
  const publicPaths = [
    '/book', 
    '/espace-client', 
    '/api/auth/login', 
    '/api/auth/verify', 
    '/api/auth/logout', 
    '/api/auth/shopify-proxy',
    '/api/auth/shopify',
    '/api/2fa',
    '/api/auth/callback',
    '/api/stripe/payment-intent',
    '/api/stripe/payment-link',
    '/api/bookings/create',
    '/api/shopify/webhook',
    '/api/shopify/customer-orders',
    '/api/notify',
    '/api/equipment/',
    '/api/cron/',
    '/api/simulator/',
    '/api/promos/validate',
    '/api/health'
  ];
  
  // Let Next.js static assets pass
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some(p => pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check auth — accept cookie (standard), partitioned cookie (CHIPS/Chrome iframe), or X-Admin-Token header (localStorage fallback)
  const sessionToken = req.cookies.get('admin_session')?.value
    || req.cookies.get('admin_session_p')?.value
    || req.headers.get('X-Admin-Token');

  if (!sessionToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (payload.role !== 'admin') {
      throw new Error('Invalid role');
    }
    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const res = NextResponse.next();
    res.cookies.delete('admin_session');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
