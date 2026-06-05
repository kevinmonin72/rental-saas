import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req) {
  try {
    const body = await req.json();
    const { paymentIntentId, customerData, bookingData, items, appliedPromo } = body;

    // 1. Verify Payment Intent if not mocked
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'ID de paiement manquant' }, { status: 400 });
    }

    if (!paymentIntentId.startsWith('mock_')) {
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return NextResponse.json({ error: 'Configuration Stripe manquante sur le serveur' }, { status: 500 });
      }

      const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (pi.status !== 'succeeded') {
        return NextResponse.json({ error: 'Le paiement na pas été validé par Stripe' }, { status: 400 });
      }
    }

    // 2. Create or Update Customer
    let customerId = null;
    const email = customerData.email.trim().toLowerCase();

    const { data: existingCust, error: searchErr } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (searchErr) throw searchErr;

    if (existingCust) {
      customerId = existingCust.id;
      let updateData = {};
      if (customerData.phone) updateData.phone = customerData.phone.trim();
      if (customerData.address) updateData.address = customerData.address.trim();
      if (Object.keys(updateData).length > 0) {
        await supabaseAdmin.from('customers').update(updateData).eq('id', customerId);
      }
    } else {
      customerId = uuidv4();
      const { error: custErr } = await supabaseAdmin.from('customers').insert([{
        id: customerId,
        first_name: customerData.firstName.trim(),
        last_name: customerData.lastName.trim(),
        email: email,
        phone: customerData.phone?.trim() || null,
        address: customerData.address?.trim() || null
      }]);
      if (custErr) throw custErr;
    }

    // 3. Create Booking
    const bookingId = uuidv4();
    const { error: bookErr } = await supabaseAdmin.from('bookings').insert([{
      id: bookingId,
      customer_id: customerId,
      start_date: bookingData.startDate,
      end_date: bookingData.endDate,
      status: 'active',
      shopify_transfer: false,
      rental_type: bookingData.rentalType
    }]);

    if (bookErr) throw bookErr;

    // 4. Create Booking Items
    const bookingItemsToInsert = items.map(item => ({
      id: uuidv4(),
      booking_id: bookingId,
      equipment_id: item.equipment_id,
      quantity: item.quantity
    }));

    const { error: itemsErr } = await supabaseAdmin.from('booking_items').insert(bookingItemsToInsert);
    if (itemsErr) throw itemsErr;

    // 5. Update Promo Code usage if any
    if (appliedPromo && appliedPromo.id) {
      const { data: promo } = await supabaseAdmin.from('promo_codes').select('used_count').eq('id', appliedPromo.id).single();
      if (promo) {
        await supabaseAdmin.from('promo_codes').update({ used_count: promo.used_count + 1 }).eq('id', appliedPromo.id);
      }
    }

    // 6. Send notification email
    try {
      const sDate = new Date(bookingData.startDate);
      const eDate = new Date(bookingData.endDate);
      const datesStr = `Du ${sDate.toLocaleDateString('fr-FR')} au ${eDate.toLocaleDateString('fr-FR')}`;
      
      // Call internal /api/notify route or use logic here
      // For simplicity, we trigger the internal fetch, but from server we should use absolute URL
      // Since it's server-to-server in Next.js, it's tricky. Let's just catch errors.
      // A better way is to move notify logic here, but we will keep the original flow
      const notifyUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/notify` : 'http://localhost:3000/api/notify';
      await fetch(notifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: customerData.firstName.trim(),
          lastName: customerData.lastName.trim(),
          email: email,
          phone: customerData.phone?.trim(),
          address: customerData.address?.trim(),
          equipmentCount: items.length,
          dates: datesStr
        })
      });
    } catch (e) {
      console.error("Erreur notification depuis create booking:", e);
    }

    return NextResponse.json({ success: true, bookingId });

  } catch (error) {
    console.error('Erreur API Create Booking:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
