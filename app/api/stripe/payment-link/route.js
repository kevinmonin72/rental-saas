import Stripe from 'stripe';

export async function POST(req) {
  try {
    const { amount, description, customerEmail, invoiceNumber } = await req.json();
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Clé Stripe non configurée" }), { status: 500 });
    }

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
      customer_email: customerEmail || undefined,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erreur génération lien de paiement Stripe:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
