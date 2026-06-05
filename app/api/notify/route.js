import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_for_build');
    const data = await req.json();
    const { firstName, lastName, email, phone, address, equipmentCount, dates } = data;

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY is not configured. Email will not be sent.");
      return NextResponse.json({ success: true, warning: 'No API Key' });
    }

    const { data: emailData, error } = await resend.emails.send({
      from: 'The Ridery Booking <onboarding@resend.dev>', // or a verified domain later
      to: ['marketing@theridery.com'],
      subject: `🎉 Nouvelle Réservation de ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h1 style="color: #F97316;">Nouvelle Réservation Entrante !</h1>
          <p>Vous avez reçu une nouvelle réservation via le portail client.</p>
          
          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Coordonnées du client</h3>
          <ul>
            <li><strong>Nom :</strong> ${firstName} ${lastName}</li>
            <li><strong>Email :</strong> <a href="mailto:${email}">${email}</a></li>
            <li><strong>Téléphone :</strong> ${phone || 'Non renseigné'}</li>
            <li><strong>Adresse :</strong> ${address || 'Non renseignée'}</li>
          </ul>

          <h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails</h3>
          <ul>
            <li><strong>Dates :</strong> ${dates}</li>
            <li><strong>Nombre d'articles :</strong> ${equipmentCount} articles loués</li>
          </ul>
          
          <br/>
          <p>Connectez-vous à votre tableau de bord pour voir les détails complets du matériel.</p>
          <p><a href="https://rental-saas-seven.vercel.app/" style="background-color: #111827; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Accéder au Back-office</a></p>
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
