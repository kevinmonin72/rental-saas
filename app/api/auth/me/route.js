import { NextResponse } from 'next/server';
import { verifyToken, signToken } from '../../../../lib/auth';

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const RENEW_THRESHOLD_SECONDS = 7 * 24 * 60 * 60; // renew if < 7 days left

function setSessionCookies(response, token) {
  response.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  });
  response.headers.append(
    'Set-Cookie',
    `admin_session_p=${token}; Max-Age=${COOKIE_MAX_AGE}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
  );
}

export async function GET(req) {
  // Accept standard cookie, partitioned cookie (CHIPS), or X-Admin-Token header (localStorage fallback)
  const cookieToken = req.cookies.get('admin_session')?.value
    || req.cookies.get('admin_session_p')?.value;
  const headerToken = req.headers.get('X-Admin-Token');
  const rawToken = cookieToken || headerToken;

  if (!rawToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyToken(rawToken);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true });

  // Sliding session: renew token if less than 7 days remaining
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp - now < RENEW_THRESHOLD_SECONDS) {
    const newToken = await signToken({ role: 'admin' }, '30d');
    setSessionCookies(response, newToken);
    response.headers.set('X-Renewed-Token', newToken);
  }

  return response;
}
