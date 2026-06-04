'use client';

import { useState } from 'react';
import Link from 'next/link';

const GENERIC_EQUIPMENTS = [
  { reference: 'LOK-BOARDBAG-OPT', name: 'Boardbag opt.', category: 'Accessoires', quantity: 15 },
  { reference: 'LOK-PACK-KITE', name: 'Pack Kitesurf - à personnaliser ✨', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-AILE-BARRE', name: 'Aile + Barre', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-PACK-2AILES-BARRE', name: 'Pack 2 Ailes + Barre', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-BOARD-TWINTIP', name: 'Planche Twintip', category: 'Kitesurf', quantity: 19 },
  { reference: 'LOK-WING-AILE', name: 'Aile de Wing', category: 'Wingfoil', quantity: 49 },
  { reference: 'LOK-HARNAIS-CULOTTE', name: 'Harnais culotte', category: 'Accessoires', quantity: 50 },
  { reference: 'LOK-AILE-SANSBARRE', name: 'Deuxième aile (sans barre)', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-NEOPRENE-COMBINAISON', name: 'Combinaison', category: 'Néoprène', quantity: 60 },
  { reference: 'LOK-PACK-WING-GONFLABLE', name: 'Pack Wing gonflable', category: 'Wingfoil', quantity: 49 },
  { reference: 'LOK-NEOPRENE-CAGOULE', name: 'Cagoule', category: 'Néoprène', quantity: 50 },
  { reference: 'LOK-PACK-WING-RIGIDE', name: 'Pack Wing rigide', category: 'Wingfoil', quantity: 45 },
  { reference: 'LOK-PACK-WING-DEBUTANT', name: 'Pack Wing débutant', category: 'Wingfoil', quantity: 25 },
  { reference: 'LOK-WING-FOIL', name: 'Foil de Wing', category: 'Wingfoil', quantity: 25 },
  { reference: 'LOK-WING-BOARD', name: 'Planche de Wing', category: 'Wingfoil', quantity: 49 },
  { reference: 'LOK-WING-2AILE', name: 'Deuxième Aile de Wing', category: 'Wingfoil', quantity: 25 },
  { reference: 'LOK-CAGOULE-OPT', name: 'Cagoule opt.', category: 'Néoprène', quantity: 15 },
  { reference: 'LOK-CHAUSSONS-OPT', name: 'Chaussons opt.', category: 'Néoprène', quantity: 15 },
  { reference: 'LOK-GANTS-OPT', name: 'Gants opt.', category: 'Néoprène', quantity: 15 },
  { reference: 'LOK-HARNAIS-CEINTURE', name: 'Harnais ceinture', category: 'Accessoires', quantity: 50 },
  { reference: 'LOK-NEOPRENE-VESTE', name: 'Veste néoprène', category: 'Néoprène', quantity: 25 },
  { reference: 'LOK-NEOPRENE-CHAUSSONS', name: 'Chaussons', category: 'Néoprène', quantity: 25 },
  { reference: 'LOK-COMBINAISON-OPT', name: 'Combinaison opt.', category: 'Néoprène', quantity: 25 },
  { reference: 'LOK-BOARDBAG', name: 'Boardbag', category: 'Accessoires', quantity: 25 },
  { reference: 'LOK-NEOPRENE-GANTS', name: 'Gants', category: 'Néoprène', quantity: 25 },
  { reference: 'LOK-HARNAIS-CEINTURE-OPT', name: 'Harnais ceinture opt.', category: 'Accessoires', quantity: 25 },
  { reference: 'LOK-PROT-CASQUE', name: 'Casque', category: 'Protections', quantity: 50 },
  { reference: 'LOK-VESTENEOPRENE-OPT', name: 'Veste Néoprène opt.', category: 'Néoprène', quantity: 15 },
  { reference: 'LOK-PROT-GILET', name: 'Gilet', category: 'Protections', quantity: 50 },
  { reference: 'LOK-CASQUE-OPT', name: 'Casque opt.', category: 'Protections', quantity: 25 },
  { reference: 'LOK-GILET-OPT', name: 'Gilet opt.', category: 'Protections', quantity: 50 },
  { reference: 'LOK-HARNAIS-CULOTTE-OPT', name: 'Harnais Culotte opt.', category: 'Accessoires', quantity: 25 },
  { reference: 'LOK-3AILE-SANSBARRE', name: 'Troisième aile (sans barre)', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-2AILE-SANSBARRE-CS', name: 'Deuxième aile (sans barre) - carte session', category: 'Carte Session', quantity: 15 },
  { reference: 'LOK-3AILE-SANSBARRE-CS', name: 'Troisième aile (sans barre) - carte session', category: 'Carte Session', quantity: 15 },
  { reference: 'LOK-TWINTIP-OPT-CS', name: 'Planche Twintip opt. - carte session', category: 'Carte Session', quantity: 15 },
  { reference: 'LOK-2WING-AILE-CS', name: 'Deuxième Aile de Wing - carte session', category: 'Carte Session', quantity: 15 },
  { reference: 'LOK-INITIATION-FOIL-TRACTE', name: 'Initiation foil tracté', category: 'Initiation', quantity: 4 },
  { reference: 'LOK-BARRE', name: 'Barre', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-KITEFOIL', name: 'Kitefoil', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-STRAPLESS', name: 'Strapless', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-TWINTIP-OPT', name: 'Planche Twintip Opt.', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-BOARD-FOIL-WING', name: 'Planche + Foil de Wing', category: 'Wingfoil', quantity: 49 },
  { reference: 'LOK-PADDLE', name: 'Paddle', category: 'Autres', quantity: 25 },
  { reference: 'LOK-SURF', name: 'Surf', category: 'Autres', quantity: 50 }
];

const getPricePerDay = (reference) => {
  if (reference.includes('PACK')) return 40; 
  if (reference.includes('WING') || reference.includes('FOIL') || reference.includes('KITE')) return 25; 
  if (reference.includes('BOARD') || reference.includes('TWINTIP')) return 20; 
  if (reference.includes('NEOPRENE') || reference.includes('COMBINAISON')) return 10; 
  return 10; 
};

export default function InvoiceGenerator() {
  const [invoiceData, setInvoiceData] = useState({
    number: `FA-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
    date: new Date().toISOString().split('T')[0],
    companyName: 'THE RIDERY',
    companyAddress: '14 B RUE JADIN\n75017 PARIS',
    clientName: '',
    clientAddress: '',
    items: [
      { id: 1, reference: '', description: '', quantity: 1, unitPrice: 0 }
    ],
    taxRate: 20
  });

  const [quickRef, setQuickRef] = useState('');

  const handleQuickAddRef = (e) => {
    e.preventDefault();
    if (!quickRef.trim()) return;
    const eq = GENERIC_EQUIPMENTS.find(e => e.reference.toLowerCase() === quickRef.trim().toLowerCase());
    if (eq) {
      setInvoiceData({
        ...invoiceData,
        items: [
          ...invoiceData.items, 
          { 
            id: Date.now(), 
            reference: eq.reference, 
            description: eq.name, 
            quantity: 1, 
            unitPrice: getPricePerDay(eq.reference) 
          }
        ]
      });
      setQuickRef('');
    } else {
      alert("Référence introuvable.");
    }
  };

  const handleAddItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, { id: Date.now(), reference: '', description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const handleRemoveItem = (id) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter(item => item.id !== id)
    });
  };

  const handleItemChange = (id, field, value) => {
    let newItems = invoiceData.items.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        // Si on change la référence via le select, on auto-remplit la description et le prix
        if (field === 'reference' && value) {
          const eq = GENERIC_EQUIPMENTS.find(e => e.reference === value);
          if (eq) {
            updated.description = eq.name;
            updated.unitPrice = getPricePerDay(eq.reference);
          }
        }
        return updated;
      }
      return item;
    });

    setInvoiceData({
      ...invoiceData,
      items: newItems
    });
  };

  const calculateSubtotal = () => {
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-page-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Link href="/settings" style={{ color: 'var(--text-light)', textDecoration: 'none', fontSize: '14px', display: 'inline-block', marginBottom: '8px' }}>← Retour aux paramètres</Link>
          <h1 style={{ margin: 0 }}>Générateur de Facture</h1>
        </div>
        <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', padding: '12px 24px' }}>
          <span>🖨️</span> Imprimer / PDF
        </button>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="no-print invoice-layout">
        
        {/* FORMULAIRE DE CONFIGURATION */}
        <div className="card no-print" style={{ flex: 1, minWidth: '450px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '24px' }}>Détails de la facture</h2>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">N° Facture</label>
              <input type="text" className="input" value={invoiceData.number} onChange={e => setInvoiceData({...invoiceData, number: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Date</label>
              <input type="date" className="input" value={invoiceData.date} onChange={e => setInvoiceData({...invoiceData, date: e.target.value})} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Votre Entreprise</h3>
            <div className="form-group">
              <input type="text" className="input" placeholder="Nom de l'entreprise" value={invoiceData.companyName} onChange={e => setInvoiceData({...invoiceData, companyName: e.target.value})} />
            </div>
            <div className="form-group">
              <textarea className="input" placeholder="Adresse de l'entreprise" rows={3} value={invoiceData.companyAddress} onChange={e => setInvoiceData({...invoiceData, companyAddress: e.target.value})} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '12px' }}>Client</h3>
            <div className="form-group">
              <input type="text" className="input" placeholder="Nom du client" value={invoiceData.clientName} onChange={e => setInvoiceData({...invoiceData, clientName: e.target.value})} />
            </div>
            <div className="form-group">
              <textarea className="input" placeholder="Adresse du client" rows={3} value={invoiceData.clientAddress} onChange={e => setInvoiceData({...invoiceData, clientAddress: e.target.value})} />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>Lignes de facturation</h3>
              <button type="button" onClick={handleAddItem} style={{ color: 'var(--primary-color)', fontSize: '13px', fontWeight: 'bold', background: 'transparent', border: 'none', cursor: 'pointer' }}>+ Ligne vide</button>
            </div>
            
            <form onSubmit={handleQuickAddRef} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="input" 
                placeholder="Entrez une référence (ex: LOK-SURF) puis Entrée" 
                value={quickRef}
                onChange={e => setQuickRef(e.target.value)}
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '0 16px', fontSize: '13px' }}>Ajouter</button>
            </form>
            
            {invoiceData.items.map((item) => (
              <div key={item.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', alignItems: 'flex-start', paddingBottom: '16px', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ width: '100%', marginBottom: '4px' }}>
                  <select 
                    className="input" 
                    value={item.reference} 
                    onChange={e => handleItemChange(item.id, 'reference', e.target.value)}
                    style={{ fontSize: '13px' }}
                  >
                    <option value="">-- Choisir un produit catalogue (Optionnel) --</option>
                    {GENERIC_EQUIPMENTS.map(eq => (
                      <option key={eq.reference} value={eq.reference}>{eq.reference} - {eq.name}</option>
                    ))}
                  </select>
                </div>
                <input type="text" className="input" placeholder="Description" style={{ flex: 3 }} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} />
                <input type="number" className="input" placeholder="Qté" style={{ flex: 1, minWidth: '60px' }} value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                <input type="number" className="input" placeholder="Prix Unit." style={{ flex: 1, minWidth: '80px' }} value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
                <button type="button" onClick={() => handleRemoveItem(item.id)} style={{ padding: '10px', color: '#EF4444', fontSize: '16px' }}>×</button>
              </div>
            ))}
          </div>

          <div className="form-group" style={{ width: '150px' }}>
            <label className="form-label">TVA (%)</label>
            <input type="number" className="input" value={invoiceData.taxRate} onChange={e => setInvoiceData({...invoiceData, taxRate: parseFloat(e.target.value) || 0})} />
          </div>

        </div>

        {/* APERÇU DE LA FACTURE */}
        <div id="printable-invoice" style={{ flex: 2, backgroundColor: 'white', padding: '48px', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', color: '#111827', minHeight: '842px', width: '100%', maxWidth: '794px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '64px' }}>
            <div>
              <h1 style={{ fontSize: '32px', margin: '0 0 16px 0', color: '#1F2937', fontWeight: 800 }}>FACTURE</h1>
              <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6B7280' }}><strong>N° :</strong> {invoiceData.number}</p>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}><strong>Date :</strong> {new Date(invoiceData.date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111827' }}>{invoiceData.companyName}</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{invoiceData.companyAddress}</p>
            </div>
          </div>

          <div style={{ marginBottom: '48px', padding: '24px', backgroundColor: '#F9FAFB', borderRadius: '8px', display: 'inline-block', minWidth: '300px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#6B7280', textTransform: 'uppercase' }}>Facturé à</h3>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#111827' }}>{invoiceData.clientName || 'Nom du client'}</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{invoiceData.clientAddress || 'Adresse du client'}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '48px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '12px 0', color: '#6B7280', fontSize: '13px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ textAlign: 'center', padding: '12px 0', color: '#6B7280', fontSize: '13px', textTransform: 'uppercase' }}>Qté</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: '#6B7280', fontSize: '13px', textTransform: 'uppercase' }}>Prix Unitaire HT</th>
                <th style={{ textAlign: 'right', padding: '12px 0', color: '#6B7280', fontSize: '13px', textTransform: 'uppercase' }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '16px 0', fontSize: '15px' }}>{item.description}</td>
                  <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '15px' }}>{item.quantity}</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '15px' }}>{item.unitPrice.toFixed(2)} €</td>
                  <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '15px', fontWeight: 500 }}>{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '300px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', color: '#4B5563', fontSize: '14px' }}>
                <span>Sous-total HT</span>
                <span>{subtotal.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '2px solid #E5E7EB', color: '#4B5563', fontSize: '14px' }}>
                <span>TVA ({invoiceData.taxRate}%)</span>
                <span>{tax.toFixed(2)} €</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>
                <span>Total TTC</span>
                <span>{total.toFixed(2)} €</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '80px', borderTop: '1px solid #E5E7EB', paddingTop: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '12px' }}>
            <p style={{ margin: '0 0 4px 0' }}>Merci pour votre confiance !</p>
            <p style={{ margin: 0 }}>Pour toute question concernant cette facture, veuillez nous contacter.</p>
          </div>

        </div>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 1100px) {
          .invoice-layout {
            flex-direction: column;
          }
        }
      `}} />
    </div>
  );
}
