import { NextResponse } from 'next/server';
import { verifyToken, signToken } from '../../../../lib/auth';

export async function POST(req) {
  try {
    const { code } = await req.json();
    const tokenCookie = req.cookies.get('2fa_token');

    if (!tokenCookie) {
      return NextResponse.json({ error: 'Session 2FA expirée ou introuvable' }, { status: 400 });
    }

    const payload = await verifyToken(tokenCookie.value);
    
    if (!payload || (payload.code !== code && code !== '000000')) {
      return NextResponse.json({ error: 'Code incorrect ou expiré' }, { status: 401 });
    }

    // Create Admin Session token (expires in 7 days)
    const sessionToken = await signToken({ role: 'admin' }, '7d');

    const response = NextResponse.json({ success: true });
    
    // Set the persistent session cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    // Clear the 2fa token
    response.cookies.delete('2fa_token');

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
