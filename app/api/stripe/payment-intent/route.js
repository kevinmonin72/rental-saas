import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getPricePerDay = (reference) => {
  if (reference.includes('PACK')) return 40; // Packs: 40€/jour
  if (reference.includes('WING') || reference.includes('FOIL') || reference.includes('KITE')) return 25; // Ailes/Foils: 25€/jour
  if (reference.includes('BOARD') || reference.includes('TWINTIP')) return 20; // Planches: 20€/jour
  if (reference.includes('NEOPRENE') || reference.includes('COMBINAISON')) return 10; // Néoprène: 10€/jour
  return 10; // Reste (accessoires, gilets, etc.): 10€/jour
};

export async function POST(req) {
  try {
    const { equipmentReferences, startDate, endDate, durationMode, promoCode, email } = await req.json();

    if (!startDate || !equipmentReferences || equipmentReferences.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Calculate duration in days
    let days = 1;
    if (durationMode === 'days' && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e - s);
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    // Calculate total price
    let pricePerDayTotal = 0;
    for (const ref of equipmentReferences) {
      pricePerDayTotal += getPricePerDay(ref);
    }
    
    // Half-day is 60% of the daily rate (0.6 multiplier)
    const isHalfDay = durationMode === 'half_day';
    let subtotal = 0;
    if (isHalfDay) {
      subtotal = Math.round(pricePerDayTotal * 0.6);
    } else {
      subtotal = pricePerDayTotal * days;
    }

    // Apply promo if any
    if (promoCode) {
      const { data: promo, error } = await supabase.from('promo_codes').select('*').eq('code', promoCode.toUpperCase()).maybeSingle();
      if (!error && promo && promo.is_active) {
        let isValid = true;
        if (promo.max_uses && promo.used_count >= promo.max_uses) isValid = false;
        if (promo.target_email && email && promo.target_email.toLowerCase() !== email.toLowerCase()) isValid = false;

        if (isValid) {
          if (promo.discount_type === 'percentage') {
            subtotal = subtotal * (1 - promo.discount_value / 100);
          } else if (promo.discount_type === 'amount') {
            subtotal = subtotal - promo.discount_value;
          }
        }
      }
    }

    const amountInCents = Math.max(0, Math.round(subtotal * 100));
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      console.log("Stripe Secret Key non configurée. Passage en mode simulation.");
      return NextResponse.json({
        mock: true,
        clientSecret: 'mock_secret_intent_' + Math.random().toString(36).substring(2),
        amount: amountInCents / 100,
        days: isHalfDay ? 0.5 : days
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
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
      days: isHalfDay ? 0.5 : days
    });

  } catch (error) {
    console.error('Erreur API Stripe PaymentIntent:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
