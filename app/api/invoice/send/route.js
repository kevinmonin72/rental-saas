import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { invoiceData, customerEmail } = await req.json();
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyToken) {
      return NextResponse.json({ error: "Token Shopify non configuré" }, { status: 500 });
    }
    if (!customerEmail) {
      return NextResponse.json({ error: "L'email du client est requis" }, { status: 400 });
    }

    // Prepare Line Items
    const lineItems = invoiceData.items.filter(item => {
      // Ignorer uniquement si c'est vraiment vide (0 qté, 0 prix, pas de description)
      if (!item.description && !item.reference && item.quantity === 0 && item.unitPrice === 0) return false;
      return true;
    }).map(item => {
      return {
        title: item.description || item.reference || 'Équipement (Ligne vide)',
        price: item.unitPrice.toString(),
        quantity: item.quantity,
        sku: item.reference || '',
        custom: true
      };
    }).filter(Boolean);

    // Prepare tax if necessary
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    if (taxAmount > 0) {
      lineItems.push({
        title: `TVA (${invoiceData.taxRate}%)`,
        price: taxAmount.toString(),
        quantity: 1,
        custom: true
      });
    }

    const payload = {
      draft_order: {
        line_items: lineItems,
        email: customerEmail,
        use_customer_default_address: false,
        tags: `invoice_${invoiceData.number || 'rental_saas'}`,
        note: `Facture The Ridery - ${invoiceData.number}`,
        customer: {
          first_name: invoiceData.clientName || 'Client',
          last_name: '-',
          email: customerEmail,
        },
        billing_address: {
          first_name: invoiceData.clientName || 'Client',
          last_name: '-',
          address1: invoiceData.clientAddress || '',
        }
      }
    };

    // 1. Create Draft Order
    const shopifyRes = await fetch('https://shop-theridery.myshopify.com/admin/api/2024-01/draft_orders.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify(payload)
    });

    const data = await shopifyRes.json();

    if (!shopifyRes.ok) {
      console.error('Erreur Shopify Draft Order:', data);
      return NextResponse.json({ error: "Erreur lors de la création de la facture Shopify" }, { status: 500 });
    }

    const draftOrderId = data.draft_order.id;
    const invoiceUrl = data.draft_order.invoice_url;

    // Attendre 1.5 seconde car Shopify a besoin de temps pour calculer les taxes en arrière-plan
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (invoiceData.isAlreadyPaid) {
      // 2A. Complete Draft Order to create a Paid Order
      const completeRes = await fetch(`https://shop-theridery.myshopify.com/admin/api/2024-01/draft_orders/${draftOrderId}/complete.json?payment_pending=false`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken
        }
      });
      const completeData = await completeRes.json();
      if (!completeRes.ok) {
        console.error('Erreur Shopify Complete Order:', completeData);
        return NextResponse.json({ error: "Erreur lors de la validation du paiement Shopify" }, { status: 500 });
      }
      return NextResponse.json({ success: true, url: invoiceUrl, status: 'paid' }, { status: 200 });
    } else {
      // 2B. Send Invoice Email with Payment Link
      const sendRes = await fetch(`https://shop-theridery.myshopify.com/admin/api/2024-01/draft_orders/${draftOrderId}/send_invoice.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': shopifyToken
        },
        body: JSON.stringify({
          draft_order_invoice: {
            to: customerEmail,
            subject: `Votre facture The Ridery - ${invoiceData.number}`,
            custom_message: "Merci pour votre réservation. Voici le lien pour régler votre facture de location."
          }
        })
      });

      const sendData = await sendRes.json();

      if (!sendRes.ok) {
        console.error('Erreur Shopify Send Invoice:', sendData);
        return NextResponse.json({ error: "Erreur lors de l'envoi de la facture Shopify" }, { status: 500 });
      }

      return NextResponse.json({ success: true, url: invoiceUrl, status: 'pending' }, { status: 200 });
    }
  } catch (error) {
    console.error('Erreur Shopify Invoicing:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
