import { NextResponse } from 'next/server';
import { signToken } from '../../../../lib/auth';

const ADMIN_USERNAME = "marketing@theridery.com";
const ADMIN_PASSWORD = "Theriderywingboost2K26!!";

export async function POST(req) {
  try {
    const { adminId, password } = await req.json();

    if (adminId.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Temporarily disabled 2FA due to Klaviyo issues
    // Directly sign the admin session token
    const sessionToken = await signToken({ role: 'admin' }, '7d');

    const response = NextResponse.json({ success: true, bypass2FA: true });
    
    // Set the persistent session cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
