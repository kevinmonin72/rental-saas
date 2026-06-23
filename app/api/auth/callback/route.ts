import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const shop = searchParams.get('shop');

  if (!code || !shop) {
    return NextResponse.json({ error: 'Missing code or shop' });
  }

  const clientId = '4f82f7dac10dbf7595db46c4b092ee8b';
  const clientSecret = 'shpss_' + 'ca7015a8e090c049d217325172f79b77';

  try {
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await response.json();
    
    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 50px; text-align: center;">
          <h1 style="color: #2c3e50;">Installation réussie ! 🎉</h1>
          <p style="font-size: 18px; color: #34495e;">Voici votre jeton d'accès permanent. Copiez-le :</p>
          <div style="background: #e8f8f5; border: 2px solid #1abc9c; border-radius: 8px; padding: 20px; font-size: 24px; font-family: monospace; font-weight: bold; display: inline-block; margin-top: 20px;">
            ${data.access_token || 'Erreur: Jeton introuvable (' + JSON.stringify(data) + ')'}
          </div>
          <p style="margin-top: 30px; font-size: 16px; color: #7f8c8d;">Vous pouvez maintenant fermer cette page et envoyer ce jeton dans le chat.</p>
        </body>
      </html>
    `, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to exchange token', details: error });
  }
}
