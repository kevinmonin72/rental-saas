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

    // Generate secure 6-digit code server-side
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Log the code locally for development purposes since email delivery might be delayed
    console.log(`[2FA CODE GENERATED] ${code}`);

    // Send code via Klaviyo
    const klaviyoKey = process.env.KLAVIYO_PRIVATE_KEY;
    if (!klaviyoKey) {
      console.warn("KLAVIYO_PRIVATE_KEY is not defined, skipping email sending.");
    } else {
      const options = {
        method: 'POST',
        headers: {
          accept: 'application/json',
          revision: '2024-02-15',
          'content-type': 'application/json',
          Authorization: `Klaviyo-API-Key ${klaviyoKey}`
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              properties: { AdminCode: code },
              metric: { data: { type: 'metric', attributes: { name: 'Admin Login Request' } } },
              profile: { data: { type: 'profile', attributes: { email: ADMIN_USERNAME } } }
            }
          }
        })
      };

      const klaviyoResponse = await fetch('https://a.klaviyo.com/api/events/', options);
      if (!klaviyoResponse.ok) {
        console.error('Klaviyo event error', await klaviyoResponse.text());
      }
    }

    // Create 2FA token (expires in 10 minutes)
    const token = await signToken({ code }, '10m');

    // Set HTTP-only cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('2fa_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 600, // 10 minutes
      path: '/'
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
