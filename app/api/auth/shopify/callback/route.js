import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');

  if (!shop || !code) {
    return NextResponse.json({ error: 'Missing shop or code' }, { status: 400 });
  }

  const clientId = '6416f25b875c33e918b0e62ebb48f6be';
  const clientSecret = process.env.SHOPIFY_API_SECRET_KEY || 'HIDDEN';

  try {
    const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Node.js)',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const dataText = await res.text();
    let data;
    try {
      data = JSON.parse(dataText);
    } catch (err) {
      return new NextResponse(`
        <html>
          <body>
            <h1>Erreur Shopify</h1>
            <p>Shopify a retourné une page HTML au lieu de JSON :</p>
            <pre style="white-space: pre-wrap;">${dataText}</pre>
          </body>
        </html>
      `, { headers: { 'Content-Type': 'text/html' } });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to exchange token', details: data }, { status: 500 });
    }

    return new NextResponse(`
      <html>
        <body style="font-family: sans-serif; padding: 2rem;">
          <h1>✅ Authentification Shopify Réussie !</h1>
          <p>Voici votre Token d'accès sécurisé :</p>
          <pre style="background: #eee; padding: 1rem; border-radius: 8px; font-size: 1.2rem;">${data.access_token}</pre>
          <p>Veuillez copier ce token et le coller dans le chat à votre assistant IA pour terminer la configuration.</p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
