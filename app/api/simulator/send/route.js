import { NextResponse } from 'next/server';

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req) {
  try {
    const { items, customer, vendeur, discount } = await req.json();
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyToken) {
      return NextResponse.json({ error: "Token Shopify non configuré" }, { status: 500 });
    }
    if (!customer || !customer.email) {
      return NextResponse.json({ error: "L'email du client est requis" }, { status: 400 });
    }

    const lineItems = items.map(item => {
      return {
        variant_id: item.variant_id,
        quantity: item.quantity || 1
      };
    });

    let tags = "simulateur_devis";
    if (vendeur) {
      tags += `, vendeur_${vendeur.replace(/\s+/g, '_')}`;
    }

    let appliedDiscount = null;
    if (discount) {
      if (discount.type === 'percent' && discount.value > 0) {
        appliedDiscount = {
          value: discount.value,
          value_type: "percentage",
          title: discount.code || "Remise"
        };
      } else if (discount.type === 'euro' && discount.value > 0) {
        appliedDiscount = {
          value: discount.value,
          value_type: "fixed_amount",
          title: discount.code || "Remise"
        };
      }
    }

    const payload = {
      draft_order: {
        line_items: lineItems,
        email: customer.email,
        use_customer_default_address: false,
        tags: tags,
        note_attributes: [
          {
            name: "Source",
            value: "Simulateur Devis"
          },
          {
            name: "Vendeur",
            value: vendeur || ""
          }
        ],
        customer: {
          first_name: customer.firstName || 'Client',
          last_name: customer.lastName || '-',
          email: customer.email,
        }
      }
    };

    if (appliedDiscount) {
      payload.draft_order.applied_discount = appliedDiscount;
    }

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
      return NextResponse.json({ error: "Erreur lors de la création de la facture Shopify" }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    const draftOrderId = data.draft_order.id;
    const invoiceUrl = data.draft_order.invoice_url;

    // 2. We skip sending the native Shopify invoice email, 
    // because Klaviyo will send the email using the generated invoiceUrl
    /*
    const sendRes = await fetch(`https://shop-theridery.myshopify.com/admin/api/2024-01/draft_orders/${draftOrderId}/send_invoice.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': shopifyToken
      },
      body: JSON.stringify({
        draft_order_invoice: {} // default email
      })
    });

    const sendData = await sendRes.json();
    if (!sendRes.ok) {
      console.error('Erreur Shopify Send Invoice:', sendData);
      return NextResponse.json({ error: "Erreur lors de l'envoi de la facture Shopify" }, { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }
    */

    return NextResponse.json({ success: true, url: invoiceUrl }, { 
      status: 200,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });

  } catch (error) {
    console.error('API Simulator Send Error:', error);
    return NextResponse.json({ error: "Erreur serveur" }, { 
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
