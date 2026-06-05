import { NextResponse } from 'next/server';
import { verifyToken } from '../../../../lib/auth';

export async function GET(req) {
  const sessionToken = req.cookies.get('admin_session');
  
  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const payload = await verifyToken(sessionToken.value);
  if (!payload || payload.role !== 'admin') {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
