import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const getPricePerDay = (reference) => {
  if (reference === 'CAT-WING') return 30; // 30€/day
  if (reference === 'CAT-BOARD') return 25; // 25€/day
  if (reference === 'CAT-FOIL') return 20; // 20€/day
  if (reference === 'CAT-MAST') return 10; // 10€/day
  if (reference === 'CAT-ACC') return 5; // 5€/day
  return 15;
};

export async function POST(req) {
  try {
    const { equipmentReferences, startDate, endDate } = await req.json();

    if (!startDate || !endDate || !equipmentReferences || equipmentReferences.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Calculate duration in days
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    const days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    // Calculate total price
    let pricePerDayTotal = 0;
    for (const ref of equipmentReferences) {
      pricePerDayTotal += getPricePerDay(ref);
    }
    const amountInCents = pricePerDayTotal * days * 100; // in cents for Stripe

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.log("Stripe Secret Key non configurée. Passage en mode simulation.");
      return NextResponse.json({
        mock: true,
        clientSecret: 'mock_secret_intent_' + Math.random().toString(36).substring(2),
        amount: amountInCents / 100,
        days: days
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16' // Standard stable version
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'eur',
      metadata: {
        startDate,
        endDate,
        equipments: equipmentReferences.join(', ')
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountInCents / 100,
      days: days
    });

  } catch (error) {
    console.error('Erreur API Stripe PaymentIntent:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
