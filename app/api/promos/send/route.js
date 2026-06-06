import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
    const { code, target_email, discount_type, discount_value } = await req.json();

    if (!target_email) {
      return NextResponse.json({ error: 'Ce code n\'a pas d\'email ciblé' }, { status: 400 });
    }

    const discountText = discount_type === 'percentage' ? `${discount_value}%` : `${discount_value}€`;

    // 1. Try sending via Klaviyo if configured
    const klaviyoKey = process.env.KLAVIYO_API_KEY;
    if (klaviyoKey) {
      const response = await fetch('https://a.klaviyo.com/api/events/', {
        method: 'POST',
        headers: {
          'Authorization': `Klaviyo-API-Key ${klaviyoKey}`,
          'accept': 'application/json',
          'content-type': 'application/json',
          'revision': '2024-02-15'
        },
        body: JSON.stringify({
          data: {
            type: 'event',
            attributes: {
              profile: {
                data: {
                  type: 'profile',
                  attributes: {
                    email: target_email
                  }
                }
              },
              metric: {
                data: {
                  type: 'metric',
                  attributes: {
                    name: 'Generated Promo Code'
                  }
                }
              },
              properties: {
                PromoCode: code,
                DiscountValue: discount_value,
                DiscountType: discount_type,
                DiscountText: discountText
              }
            }
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Erreur Klaviyo:", errData);
        return NextResponse.json({ error: 'Erreur lors de l\'envoi vers Klaviyo' }, { status: 500 });
      }

      return NextResponse.json({ success: true, method: 'klaviyo' });
    }

    // 2. Fallback to Resend if Klaviyo is not configured
    if (!process.env.RESEND_API_KEY) {
      console.warn("Ni KLAVIYO_API_KEY ni RESEND_API_KEY ne sont configurés.");
      return NextResponse.json({ error: 'Configuration d\'envoi (Klaviyo ou Resend) manquante' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: 'The Ridery Promo <onboarding@resend.dev>', // Update this later to a verified domain
      to: [target_email],
      subject: '🎁 Voici votre code promo The Ridery',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
          <h1 style="color: #F97316; text-align: center;">Un cadeau pour vous !</h1>
          <p>Bonjour,</p>
          <p>Nous sommes ravis de vous offrir un code de réduction spécial de <strong>${discountText}</strong> valable sur votre prochaine réservation chez The Ridery.</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #111827;">${code}</span>
          </div>

          <p>Ce code a été généré spécialement pour l'adresse e-mail <strong>${target_email}</strong>. Entrez-le simplement lors de votre validation de panier.</p>

          <p style="text-align: center; margin-top: 30px;">
            <a href="https://rental-saas-seven.vercel.app/book" style="background-color: #F97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Réserver maintenant</a>
          </p>

          <p style="margin-top: 40px; font-size: 12px; color: #888; text-align: center;">L'équipe The Ridery</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
