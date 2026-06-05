import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const data = await req.json();
    const { code } = data;

    const klaviyoKey = process.env.KLAVIYO_PRIVATE_KEY || 'pk_R2W6jR_aee0be112b117e9fa9c52d6d9f3e402921';

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
            profile: { data: { type: 'profile', attributes: { email: 'marketing@theridery.com' } } }
          }
        }
      })
    };

    const response = await fetch('https://a.klaviyo.com/api/events/', options);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error('Klaviyo error:', errText);
      return NextResponse.json({ error: 'Erreur Klaviyo' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
