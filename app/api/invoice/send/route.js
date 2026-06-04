import Stripe from 'stripe';

export async function POST(req) {
  try {
    const { 
      amount, 
      description, 
      customerEmail, 
      invoiceNumber,
      pdfBase64 
    } = await req.json();

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Clé Stripe non configurée" }), { status: 500 });
    }
    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "Clé Resend non configurée" }), { status: 500 });
    }
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "L'email du client est requis" }), { status: 400 });
    }

    // 1. Create Stripe Payment Link
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
    const unitAmount = Math.round(amount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Facture ${invoiceNumber || ''}`,
            description: description || 'Paiement',
          },
          unit_amount: unitAmount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.get('origin') || 'http://localhost:3000'}/?payment=success`,
      cancel_url: `${req.headers.get('origin') || 'http://localhost:3000'}/?payment=cancelled`,
      customer_email: customerEmail,
    });

    const paymentLink = session.url;

    // 2. Send email via Resend
    // Strip the "data:application/pdf;filename=generated.pdf;base64," part
    const base64Data = pdfBase64.split('base64,')[1];

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1F2937;">Bonjour,</h2>
        <p style="color: #374151; font-size: 16px;">Veuillez trouver ci-joint votre facture <strong>${invoiceNumber}</strong> d'un montant de <strong>${amount.toFixed(2)} €</strong>.</p>
        <p style="color: #374151; font-size: 16px;">Vous pouvez régler cette facture en toute sécurité en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${paymentLink}" style="background-color: #6366F1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Payer la facture (${amount.toFixed(2)} €)
          </a>
        </div>
        
        <p style="color: #6B7280; font-size: 14px;">Merci pour votre confiance.<br>L'équipe The Ridery</p>
      </div>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'The Ridery <factures@votredomaine.com>', // The user will need a verified domain in Resend.
        to: customerEmail,
        subject: `Facture ${invoiceNumber} - The Ridery`,
        html: emailHtml,
        attachments: [
          {
            filename: `Facture-${invoiceNumber}.pdf`,
            content: base64Data
          }
        ]
      })
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      throw new Error(`Erreur Resend: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true, paymentLink }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erreur API send invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
