import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { amount, description, customerEmail, invoiceNumber } = await req.json();
    const shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN;
    
    if (!shopifyToken) {
      return NextResponse.json({ error: "Token Shopify non configuré" }, { status: 500 });
    }

    const payload = {
      draft_order: {
        line_items: [
          {
            title: `Location: ${description || 'Matériel'}`,
            price: amount.toString(),
            quantity: 1,
            custom: true
          }
        ],
        email: customerEmail || undefined,
        use_customer_default_address: true,
        tags: `invoice_${invoiceNumber || 'rental_saas'}`,
        note: `Facture générée depuis Rental SaaS ${invoiceNumber ? '#' + invoiceNumber : ''}`
      }
    };

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
      return NextResponse.json({ error: "Erreur Shopify" }, { status: 500 });
    }

    return NextResponse.json({ url: data.draft_order.invoice_url }, { status: 200 });
  } catch (error) {
    console.error('Erreur génération lien de paiement Shopify:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
