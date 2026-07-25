import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const { invoiceData, bookingId } = await req.json();
    
    // Allow using a separate key for invoices if provided, fallback to main secret key
    const stripeKey = process.env.STRIPE_INVOICE_KEY || process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Clé API Stripe non configurée' }, { status: 500 });
    }
    
    const stripe = new Stripe(stripeKey);

    const clientEmail = invoiceData.clientEmail?.trim();
    const clientName = invoiceData.clientName?.trim();

    if (!clientEmail && !clientName) {
      return NextResponse.json({ error: 'Veuillez au moins renseigner le Nom ou l\'Email du client.' }, { status: 400 });
    }

    // 1. Find or create Stripe Customer
    let stripeCustomer = null;
    
    if (clientEmail) {
      const existingStripeCustomers = await stripe.customers.search({
        query: `email:\'${clientEmail}\'`,
        limit: 1,
      });

      if (existingStripeCustomers.data.length > 0) {
        stripeCustomer = existingStripeCustomers.data[0];
      }
    }
    
    if (!stripeCustomer) {
      stripeCustomer = await stripe.customers.create({
        email: clientEmail || undefined,
        name: clientName || undefined,
        address: invoiceData.clientAddress ? {
          line1: invoiceData.clientAddress,
        } : undefined,
      });
    }

    // 2. Create Stripe Invoice Items
    let hasPrice = false;
    
    for (const item of invoiceData.items) {
      if (item.unitPrice > 0) {
        hasPrice = true;
        await stripe.invoiceItems.create({
          customer: stripeCustomer.id,
          amount: Math.round(item.unitPrice * 100),
          currency: 'eur',
          description: item.description || item.reference || 'Article',
          quantity: item.quantity > 0 ? item.quantity : 1,
        });
      }
    }
    
    // If NO items have a price > 0, create a 0€ item to allow generating the invoice anyway
    if (!hasPrice) {
       await stripe.invoiceItems.create({
          customer: stripeCustomer.id,
          amount: 0,
          currency: 'eur',
          description: 'Forfait Location',
          quantity: 1,
        });
    }

    // 3. Create Stripe Invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: 'send_invoice',
      days_until_due: 0,
      description: `Généré depuis l'outil Facturation. ${bookingId ? 'Ref: ' + bookingId : ''}`,
      metadata: {
        booking_id: bookingId || '',
      }
    });

    // 4. Finalize the invoice to generate the hosted_invoice_url
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);

    return NextResponse.json({
      id: finalizedInvoice.id,
      url: finalizedInvoice.hosted_invoice_url,
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur Stripe Create Custom Invoice:', error);
    return NextResponse.json({ error: 'Erreur Stripe: ' + error.message }, { status: 500 });
  }
}
