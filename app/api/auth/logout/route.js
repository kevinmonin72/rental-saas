import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('admin_session');
  response.headers.append(
    'Set-Cookie',
    'admin_session_p=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None; Partitioned'
  );
  return response;
}
