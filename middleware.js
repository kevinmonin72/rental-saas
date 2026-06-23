import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// We must redefine the getSecretKey here since jose needs to be imported directly in middleware
// Edge functions don't support some Node APIs if they were in lib/auth.js
const getSecretKey = () => {
  const secret = process.env.JWT_SECRET || 'TheriderySuperSecretKey2K26!!$$--secure';
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
    '/api/2fa',
    '/api/auth/callback',
    '/api/stripe/',
    '/api/bookings/create',
    '/api/shopify/',
    '/api/notify',
    '/api/equipment/sync',
    '/api/cron/',
    '/api/simulator/'
  ];
  
  // Let Next.js static assets pass
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico' || pathname.startsWith('/public')) {
    return NextResponse.next();
  }

  const isPublic = publicPaths.some(p => pathname.startsWith(p));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check auth
  const sessionToken = req.cookies.get('admin_session')?.value;
  
  if (!sessionToken) {
    // If it's an API route, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // If it's a page, redirect to root where ClientAuth will show the login
    return NextResponse.next(); // ClientAuth will handle showing the login UI
  }

  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey());
    if (payload.role !== 'admin') {
      throw new Error('Invalid role');
    }
    return NextResponse.next();
  } catch (err) {
    // Invalid token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Delete the invalid cookie and proceed to ClientAuth
    const res = NextResponse.next();
    res.cookies.delete('admin_session');
    return res;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
