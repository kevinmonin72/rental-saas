import Stripe from 'stripe';

export async function POST(req) {
  try {
    const { invoiceData, customerEmail } = await req.json();

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Clé Stripe non configurée" }), { status: 500 });
    }
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "L'email du client est requis" }), { status: 400 });
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    // 1. Find or create Stripe Customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customerEmail,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: customerEmail,
        name: invoiceData.clientName || undefined,
        address: invoiceData.clientAddress ? {
          line1: invoiceData.clientAddress
        } : undefined
      });
    }

    // 2. Create Stripe Invoice Items
    // Stripe invoices collect pending invoice items for a customer.
    // If there are existing pending items, we should ideally clear them or create a new invoice draft directly,
    // but the simplest way is to create invoice items and then create the invoice immediately.
    for (const item of invoiceData.items) {
      if (!item.description && !item.reference) continue; // Skip empty rows
      
      const unitAmount = Math.round(item.unitPrice * 100);
      
      await stripe.invoiceItems.create({
        customer: customer.id,
        currency: 'eur',
        quantity: item.quantity,
        unit_amount: unitAmount,
        description: item.description || item.reference || 'Équipement',
      });
    }

    // Add tax as a line item since managing tax rates dynamically via API requires pre-created TaxRate objects in Stripe
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    if (taxAmount > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        currency: 'eur',
        quantity: 1,
        unit_amount: Math.round(taxAmount * 100),
        description: `TVA (${invoiceData.taxRate}%)`,
      });
    }

    // 3. Create the Invoice
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 30,
      description: `Facture The Ridery - ${invoiceData.number}`,
      // Optionally we can set custom fields or metadata
      metadata: {
        ridery_invoice_number: invoiceData.number
      }
    });

    // 4. Send the Invoice
    const sentInvoice = await stripe.invoices.sendInvoice(invoice.id);

    return new Response(JSON.stringify({ success: true, invoiceId: invoice.id, url: sentInvoice.hosted_invoice_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Erreur Stripe Invoicing:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
