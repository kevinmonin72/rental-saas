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
const PRICING_GRIDS = {
  'LOK-PACK-KITE': {
    0.5: 74, 1: 79, 2: 134, 3: 184, 4: 204, 5: 214, 6: 224, 7: 234, 8: 245, 9: 255,
    10: 269, 11: 279, 12: 279, 13: 279, 14: 284, 15: 284, 16: 284, 17: 284, 18: 284,
    19: 284, 20: 284, 21: 289, 22: 289, 23: 289, 24: 289, 25: 289, 26: 289, 27: 289,
    28: 299, 29: 299, 30: 299, 31: 299
  },
  'LOK-PACK-2AILES-BARRE': {
    0.5: 74, 1: 79, 2: 134, 3: 184, 4: 204, 5: 214, 6: 224, 7: 234, 8: 245, 9: 255,
    10: 269, 11: 279, 12: 279, 13: 279, 14: 284, 15: 284, 16: 284, 17: 284, 18: 284,
    19: 284, 20: 284, 21: 289, 22: 289, 23: 289, 24: 289, 25: 289, 26: 289, 27: 289,
    28: 299, 29: 299, 30: 299, 31: 299
  },
  'LOK-AILE-BARRE': {
    0.5: 56, 1: 59, 2: 99, 3: 139, 4: 159, 5: 169, 6: 179, 7: 189, 8: 195, 9: 205,
    10: 209, 11: 219, 12: 219, 13: 219, 14: 224, 15: 224, 16: 224, 17: 224, 18: 224,
    19: 224, 20: 224, 21: 224, 22: 229, 23: 229, 24: 229, 25: 229, 26: 229, 27: 229,
    28: 249, 29: 249, 30: 249, 31: 249
  },
  'LOK-AILE-SANSBARRE': {
    0.5: 25, 1: 25, 2: 35, 3: 40, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 55,
    10: 60, 11: 60, 12: 60, 13: 60, 14: 65, 15: 65, 16: 65, 17: 65, 18: 65,
    19: 65, 20: 65, 21: 70, 22: 70, 23: 70, 24: 70, 25: 70, 26: 70, 27: 70,
    28: 72, 29: 72, 30: 72, 31: 72
  },
  'LOK-3AILE-SANSBARRE': {
    0.5: 25, 1: 25, 2: 35, 3: 40, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 55,
    10: 60, 11: 60, 12: 60, 13: 60, 14: 65, 15: 65, 16: 65, 17: 65, 18: 65,
    19: 65, 20: 65, 21: 70, 22: 70, 23: 70, 24: 70, 25: 70, 26: 70, 27: 70,
    28: 72, 29: 72, 30: 72, 31: 72
  },
  'LOK-BARRE': {
    0.5: 29, 1: 29, 2: 30, 3: 35, 4: 40, 5: 45, 6: 50, 7: 55, 8: 60, 9: 65,
    10: 70, 11: 90, 12: 90, 13: 90, 14: 90, 15: 120, 16: 120, 17: 120, 18: 120,
    19: 120, 20: 120, 21: 120, 22: 130, 23: 130, 24: 130, 25: 130, 26: 130,
    27: 130, 28: 130, 29: 130, 30: 130, 31: 130
  },
  'LOK-BOARD-TWINTIP': {
    0.5: 28, 1: 30, 2: 35, 3: 40, 4: 45, 5: 50, 6: 55, 7: 60, 8: 65, 9: 70,
    10: 75, 11: 80, 12: 85, 13: 90, 14: 120, 15: 120, 16: 120, 17: 120, 18: 120,
    19: 120, 20: 120, 21: 130, 22: 130, 23: 130, 24: 130, 25: 130, 26: 130,
    27: 130, 28: 150, 29: 150, 30: 150, 31: 150
  },
  'LOK-KITEFOIL': {
    0.5: 59, 1: 69, 2: 109, 3: 139, 4: 159, 5: 179, 6: 189, 7: 199, 8: 207, 9: 214,
    10: 219, 11: 229, 12: 229, 13: 229, 14: 229, 15: 239, 16: 239, 17: 239, 18: 239,
    19: 239, 20: 239, 21: 239, 22: 249, 23: 249, 24: 249, 25: 249, 26: 249, 27: 249,
    28: 249, 29: 249, 30: 249, 31: 249
  },
  'LOK-STRAPLESS': {
    0.5: 39, 1: 39, 2: 59, 3: 69, 4: 79, 5: 89, 6: 99, 7: 119, 8: 123, 9: 127,
    10: 129, 11: 149, 12: 149, 13: 149, 14: 149, 15: 169, 16: 169, 17: 169, 18: 169,
    19: 169, 20: 169, 21: 169, 22: 179, 23: 179, 24: 179, 25: 179, 26: 179, 27: 179,
    28: 179, 29: 179, 30: 179, 31: 179
  },
  'LOK-TWINTIP-OPT': {
    0.5: 15, 1: 20, 2: 35, 3: 45, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 50,
    10: 60, 11: 60, 12: 60, 13: 60, 14: 60, 15: 60, 16: 60, 17: 60, 18: 60,
    19: 60, 20: 60, 21: 60, 22: 60, 23: 60, 24: 60, 25: 60, 26: 60, 27: 60,
    28: 50, 29: 50, 30: 50, 31: 50
  }
};

export async function POST(req) {
  try {
    const { equipmentReferences, startDate, endDate, rentalType, promoCode, email } = await req.json();

    if (!startDate || !equipmentReferences || equipmentReferences.length === 0) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Calculate duration in days
    let days = 1;
    if (rentalType !== 'demi_matin' && rentalType !== 'demi_aprem' && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diffTime = Math.abs(e - s);
      days = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const isHalfDay = rentalType === 'demi_matin' || rentalType === 'demi_aprem';
    let subtotal = 0;

    for (const ref of equipmentReferences) {
      if (PRICING_GRIDS[ref]) {
        const grid = PRICING_GRIDS[ref];
        let gridDays = days;
        if (gridDays > 31) gridDays = 31;
        
        if (isHalfDay) {
          subtotal += grid[0.5];
        } else {
          subtotal += grid[Math.floor(gridDays)] || grid[31];
        }
      } else {
        const pricePerDay = getPricePerDay(ref);
        subtotal += isHalfDay ? Math.round(pricePerDay * 0.6) : pricePerDay * days;
      }
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
