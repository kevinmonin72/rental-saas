import { NextResponse } from 'next/server';
import { signToken } from '../../../../lib/auth';

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || '').trim();
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

export async function POST(req) {
  try {
    const { adminId, password } = await req.json();

    if (adminId.trim().toLowerCase() !== ADMIN_USERNAME.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Temporarily disabled 2FA due to Klaviyo issues
    // Directly sign the admin session token
    const sessionToken = await signToken({ role: 'admin' }, '30d');

    // Return token in body so iframe clients (where cookies are blocked) can store it
    const response = NextResponse.json({ success: true, bypass2FA: true, token: sessionToken });

    const cookieMaxAge = 60 * 60 * 24 * 30; // 30 days
    // Set standard cookie (works in most browsers)
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: cookieMaxAge,
      path: '/'
    });
    // Set Partitioned cookie (CHIPS) for Chrome in Shopify iframe context
    // This survives third-party cookie blocking by binding to the top-level site
    response.headers.append(
      'Set-Cookie',
      `admin_session_p=${sessionToken}; Max-Age=${cookieMaxAge}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned`
    );

    return response;
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
