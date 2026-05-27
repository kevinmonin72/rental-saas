import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_PASSWORD = "Theriderywingboost2K26!!";

export async function POST(request) {
  const body = await request.json();
  const { password } = body;

  if (password === ADMIN_PASSWORD) {
    // Set a secure HTTP-only cookie valid for 30 days
    cookies().set({
      name: 'auth_token',
      value: 'authenticated',
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Mot de passe incorrect' }, { status: 401 });
}
