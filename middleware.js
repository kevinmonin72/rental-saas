import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Protect all routes except /login, /api/auth, and static files
  if (
    !url.pathname.startsWith('/login') && 
    !url.pathname.startsWith('/api/auth') &&
    !url.pathname.startsWith('/logo.png') &&
    !url.pathname.startsWith('/_next')
  ) {
    const token = request.cookies.get('auth_token');
    
    if (!token || token.value !== 'authenticated') {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}
