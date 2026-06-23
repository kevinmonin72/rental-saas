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
    // Les prix saisis sont TTC. On envoie le HT à Shopify qui rajoutera la TVA automatiquement.
    const taxRate = invoiceData.taxRate || 0;
    const taxDivisor = 1 + (taxRate / 100);

    const lineItems = invoiceData.items.filter(item => {
      if (!item.description && !item.reference && item.quantity === 0 && item.unitPrice === 0) return false;
      return true;
    }).map(item => {
      const prixHT = taxRate > 0 ? (item.unitPrice / taxDivisor) : item.unitPrice;
      return {
        title: item.description || item.reference || 'Équipement (Ligne vide)',
        price: prixHT.toFixed(2),
        quantity: item.quantity,
        sku: item.reference || '',
        custom: true
      };
    }).filter(Boolean);

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
