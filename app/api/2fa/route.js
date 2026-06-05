import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
    const data = await req.json();
    const { code } = data;

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured. Email will not be sent.");
      return NextResponse.json({ success: true, warning: 'No API Key' });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'The Ridery Admin <onboarding@resend.dev>', // or a verified domain later
      to: ['marketing@theridery.com'],
      subject: `Code de sécurité Admin: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #F97316;">Tentative de connexion Administrateur</h1>
          <p>Quelqu'un essaie de se connecter à votre panneau d'administration The Ridery.</p>
          <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; font-size: 24px; text-align: center; font-weight: bold; margin: 20px 0;">
            ${code}
          </div>
          <p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez l'ignorer.</p>
        </div>
      `,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: emailData });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
