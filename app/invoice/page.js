'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

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
    clientEmail: '',
    items: [
      { id: 1, reference: '', description: '', quantity: 1, unitPrice: 0 }
    ],
    taxRate: 20
  });

  const [quickRef, setQuickRef] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendOptions, setShowSendOptions] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      const term = quickRef.trim();
      if (term.length > 1) {
        // Search equipment
        const { data: eqData } = await supabase
          .from('equipment')
          .select('*')
          .or(`reference.ilike.*${term}*,name.ilike.*${term}*`)
          .limit(10);
          
        let results = eqData || [];
        
        // Search booking if it matches pattern
        const possibleBookingRef = term.replace(/^#/, '').toUpperCase();
        if (possibleBookingRef.length >= 2) {
          const { data: bookData } = await supabase
            .from('bookings')
            .select('*, customers(first_name, last_name, email)')
            .ilike('reference', `%${possibleBookingRef}%`)
            .limit(3);
            
          if (bookData && bookData.length > 0) {
            const bookingResults = bookData.map(b => ({
              isBooking: true,
              id: b.id,
              reference: b.reference || b.id.split('-')[0].toUpperCase(),
              name: `Importer le matériel de la réservation ${(b.customers ? b.customers.first_name : b.first_name) || ''} ${(b.customers ? b.customers.last_name : b.last_name) || ''}`.trim(),
              booking: b
            }));
            results = [...bookingResults, ...results];
          }
        }
        
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [quickRef]);

  const handleQuickAddRef = async (e) => {
    e.preventDefault();
    const term = quickRef.trim();
    if (!term) return;
    
    // Check if the typed text exactly matches one of the search results
    if (searchResults && searchResults.length > 0) {
      if (searchResults.length === 1) {
        addEqToInvoice(searchResults[0]);
        return;
      }
      const exactMatch = searchResults.find(r => r.reference && r.reference.replace(/^#|^'/, '').toLowerCase() === term.replace(/^#/, '').toLowerCase());
      if (exactMatch) {
        addEqToInvoice(exactMatch);
        return;
      }
    }
    
    // Fallback manual search if searchResults didn't catch it
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .or(`reference.ilike.*${term}*,name.ilike.*${term}*`)
      .limit(10);
      
    if (data && data.length === 1) {
      addEqToInvoice(data[0]);
    } else if (data && data.length > 1) {
      const exactMatch = data.find(eq => eq.reference && eq.reference.replace(/^'/, '').toLowerCase() === term.toLowerCase());
      if (exactMatch) {
        addEqToInvoice(exactMatch);
      } else {
        alert("Plusieurs correspondances. Veuillez cliquer sur une suggestion dans la liste déroulante.");
      }
    } else {
      alert("Référence introuvable.");
    }
  };

  const PRICING_GRIDS = {
    'LOK-PACK-KITE': { 0.5: 74, 1: 79, 2: 134, 3: 184, 4: 204, 5: 214, 6: 224, 7: 234, 8: 245, 9: 255, 10: 269, 11: 279, 12: 279, 13: 279, 14: 284, 15: 284, 16: 284, 17: 284, 18: 284, 19: 284, 20: 284, 21: 289, 22: 289, 23: 289, 24: 289, 25: 289, 26: 289, 27: 289, 28: 299, 29: 299, 30: 299, 31: 299 },
    'LOK-PACK-2AILES-BARRE': { 0.5: 74, 1: 79, 2: 134, 3: 184, 4: 204, 5: 214, 6: 224, 7: 234, 8: 245, 9: 255, 10: 269, 11: 279, 12: 279, 13: 279, 14: 284, 15: 284, 16: 284, 17: 284, 18: 284, 19: 284, 20: 284, 21: 289, 22: 289, 23: 289, 24: 289, 25: 289, 26: 289, 27: 289, 28: 299, 29: 299, 30: 299, 31: 299 },
    'LOK-AILE-BARRE': { 0.5: 56, 1: 59, 2: 99, 3: 139, 4: 159, 5: 169, 6: 179, 7: 189, 8: 195, 9: 205, 10: 209, 11: 219, 12: 219, 13: 219, 14: 224, 15: 224, 16: 224, 17: 224, 18: 224, 19: 224, 20: 224, 21: 224, 22: 229, 23: 229, 24: 229, 25: 229, 26: 229, 27: 229, 28: 249, 29: 249, 30: 249, 31: 249 },
    'LOK-AILE-SANSBARRE': { 0.5: 25, 1: 25, 2: 35, 3: 40, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 55, 10: 60, 11: 60, 12: 60, 13: 60, 14: 65, 15: 65, 16: 65, 17: 65, 18: 65, 19: 65, 20: 65, 21: 70, 22: 70, 23: 70, 24: 70, 25: 70, 26: 70, 27: 70, 28: 72, 29: 72, 30: 72, 31: 72 },
    'LOK-3AILE-SANSBARRE': { 0.5: 25, 1: 25, 2: 35, 3: 40, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 55, 10: 60, 11: 60, 12: 60, 13: 60, 14: 65, 15: 65, 16: 65, 17: 65, 18: 65, 19: 65, 20: 65, 21: 70, 22: 70, 23: 70, 24: 70, 25: 70, 26: 70, 27: 70, 28: 72, 29: 72, 30: 72, 31: 72 },
    'LOK-BARRE': { 0.5: 29, 1: 29, 2: 30, 3: 35, 4: 40, 5: 45, 6: 50, 7: 55, 8: 60, 9: 65, 10: 70, 11: 90, 12: 90, 13: 90, 14: 90, 15: 120, 16: 120, 17: 120, 18: 120, 19: 120, 20: 120, 21: 120, 22: 130, 23: 130, 24: 130, 25: 130, 26: 130, 27: 130, 28: 130, 29: 130, 30: 130, 31: 130 },
    'LOK-BOARD-TWINTIP': { 0.5: 28, 1: 30, 2: 35, 3: 40, 4: 45, 5: 50, 6: 55, 7: 60, 8: 65, 9: 70, 10: 75, 11: 80, 12: 85, 13: 90, 14: 120, 15: 120, 16: 120, 17: 120, 18: 120, 19: 120, 20: 120, 21: 130, 22: 130, 23: 130, 24: 130, 25: 130, 26: 130, 27: 130, 28: 150, 29: 150, 30: 150, 31: 150 },
    'LOK-KITEFOIL': { 0.5: 59, 1: 69, 2: 109, 3: 139, 4: 159, 5: 179, 6: 189, 7: 199, 8: 207, 9: 214, 10: 219, 11: 229, 12: 229, 13: 229, 14: 229, 15: 239, 16: 239, 17: 239, 18: 239, 19: 239, 20: 239, 21: 239, 22: 249, 23: 249, 24: 249, 25: 249, 26: 249, 27: 249, 28: 249, 29: 249, 30: 249, 31: 249 },
    'LOK-STRAPLESS': { 0.5: 39, 1: 39, 2: 59, 3: 69, 4: 79, 5: 89, 6: 99, 7: 119, 8: 123, 9: 127, 10: 129, 11: 149, 12: 149, 13: 149, 14: 149, 15: 169, 16: 169, 17: 169, 18: 169, 19: 169, 20: 169, 21: 169, 22: 179, 23: 179, 24: 179, 25: 179, 26: 179, 27: 179, 28: 179, 29: 179, 30: 179, 31: 179 },
    'LOK-TWINTIP-OPT': { 0.5: 15, 1: 20, 2: 35, 3: 45, 4: 45, 5: 45, 6: 45, 7: 45, 8: 50, 9: 50, 10: 60, 11: 60, 12: 60, 13: 60, 14: 60, 15: 60, 16: 60, 17: 60, 18: 60, 19: 60, 20: 60, 21: 60, 22: 60, 23: 60, 24: 60, 25: 60, 26: 60, 27: 60, 28: 50, 29: 50, 30: 50, 31: 50 }
  };

  const addEqToInvoice = async (eq) => {
    if (!eq) return;

    if (eq.isBooking) {
      const newClientName = eq.booking.customers 
        ? `${eq.booking.customers.first_name || ''} ${eq.booking.customers.last_name || ''}`.trim() 
        : `${eq.booking.first_name || ''} ${eq.booking.last_name || ''}`.trim();
        
      const newClientEmail = (eq.booking.customers ? eq.booking.customers.email : eq.booking.email) || '';

      setInvoiceData(prev => ({
        ...prev,
        clientName: prev.clientName || newClientName,
        clientEmail: prev.clientEmail || newClientEmail
      }));

      let days = 1;
      let durationDisplay = '1 jour';
      if (eq.booking.start_date && eq.booking.end_date) {
        if (eq.booking.rental_type === 'demi_matin' || eq.booking.rental_type === 'demi_aprem') {
          days = 0.5;
          durationDisplay = '½ jour';
        } else {
          const s = new Date(eq.booking.start_date);
          const e = new Date(eq.booking.end_date);
          const diff = Math.abs(e - s);
          days = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
          durationDisplay = `${days} jours`;
        }
      }

      const { data: bItems } = await supabase.from('booking_items').select('*').eq('booking_id', eq.id);
      if (bItems && bItems.length > 0) {
        const eqIds = bItems.map(bi => bi.equipment_id);
        const { data: equipments } = await supabase.from('equipment').select('*').in('id', eqIds);
        
        if (equipments && equipments.length > 0) {
          setInvoiceData(prev => {
            let newItems = [];
            
            if (eq.booking.rental_type === 'wingboost') {
              newItems = [{
                id: Date.now(),
                reference: 'WINGBOOST',
                description: `Abonnement Wingboost - Matériel : ${equipments.map(e => e.name).join(', ')}`,
                quantity: 1,
                unitPrice: 0
              }];
            } else {
              newItems = equipments.map((itemEq, idx) => {
                const ref = itemEq.reference ? itemEq.reference.replace(/^'/, '') : '';
                let finalPrice = 0;
                let descriptionSuffix = ` (${durationDisplay})`;
                
                if (PRICING_GRIDS[ref]) {
                  const grid = PRICING_GRIDS[ref];
                  let gridDays = days;
                  if (gridDays > 31) gridDays = 31;
                  finalPrice = gridDays === 0.5 ? grid[0.5] : (grid[Math.floor(gridDays)] || grid[31]);
                } else {
                  const perDay = getPricePerDay(ref);
                  finalPrice = days === 0.5 ? Math.round(perDay * 0.6) : perDay * days;
                }

                return {
                  id: Date.now() + idx,
                  reference: ref,
                  description: (itemEq.name || 'Équipement importé') + descriptionSuffix,
                  quantity: 1,
                  unitPrice: finalPrice
                };
              });
            }
            
            const prevItemsCleaned = prev.items.filter(i => i.reference || i.description || i.unitPrice > 0);
            return {
              ...prev,
              items: [...prevItemsCleaned, ...newItems]
            };
          });
        }
      } else if (eq.booking.rental_type === 'wingboost') {
        // Handle Wingboost with no equipments
        setInvoiceData(prev => {
          const prevItemsCleaned = prev.items.filter(i => i.reference || i.description || i.unitPrice > 0);
          return {
            ...prev,
            items: [...prevItemsCleaned, {
              id: Date.now(),
              reference: 'WINGBOOST',
              description: 'Abonnement Wingboost',
              quantity: 1,
              unitPrice: 0
            }]
          };
        });
      }
    } else {
      // Direct equipment manual addition
      setInvoiceData(prev => ({
        ...prev,
        items: [
          ...prev.items, 
          { 
            id: Date.now(), 
            reference: eq.reference ? eq.reference.replace(/^'/, '') : '', 
            description: eq.name || '', 
            quantity: 1, 
            unitPrice: getPricePerDay(eq.reference || '') 
          }
        ]
      }));
    }
    setQuickRef('');
    setSearchResults([]);
  }; 


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bookingRef = params.get('bookingRef');
      if (bookingRef) {
        supabase.from('bookings').select('*, customers(first_name, last_name, email)').eq('reference', bookingRef).maybeSingle().then(({ data }) => {
          if (data) {
            addEqToInvoice({
              isBooking: true,
              id: data.id,
              reference: data.reference,
              name: `Importer le matériel de la réservation ${data.first_name || ''} ${data.last_name || ''}`.trim(),
              booking: data
            });
            window.history.replaceState({}, document.title, '/invoice');
          }
        });
      }
    }
  }, []);

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

  const calculateTotalTTC = () => {
    return invoiceData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const total = calculateTotalTTC();
  const taxMultiplier = invoiceData.taxRate / 100;
  const subtotal = total / (1 + taxMultiplier);
  const tax = total - subtotal;

  const handlePrint = () => {
    window.print();
  };
  const calculateTotal = () => {
    const subtotal = invoiceData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const taxAmount = subtotal * (invoiceData.taxRate / 100);
    const total = subtotal + taxAmount;
    return total;
  };

  const handleGeneratePaymentLink = async () => {
    setIsGeneratingLink(true);
    setPaymentLink(null);
    try {
      const totalAmount = calculateTotal();
      const res = await fetch('/api/stripe/payment-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          description: `Facture The Ridery ${invoiceData.number} - ${invoiceData.clientName}`,
          invoiceNumber: invoiceData.number,
        })
      });

      const data = await res.json();
      if (data.url) {
        setPaymentLink(data.url);
      } else {
        alert("Erreur lors de la création du lien : " + (data.error || "Inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur.");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleSendEmail = async () => {
    if (!invoiceData.clientEmail) {
      alert("Veuillez saisir une adresse email.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/invoice/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceData,
          customerEmail: invoiceData.clientEmail
        })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.url) {
          window.open(data.url, '_blank');
        }
        alert("La facture officielle a été générée et envoyée par Stripe au client avec succès !");
      } else {
        alert("Erreur lors de l'envoi : " + (data.error || "Inconnue"));
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau ou serveur lors de l'envoi.");
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="invoice-page-container">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { 
            size: A4 portrait; 
            margin: 0; 
          }
          body { 
            background: white; 
            margin: 0; 
            padding: 0; 
          }
          /* Hide sidebar and form */
          .sidebar, .no-print {
            display: none !important;
          }
          /* Reset layout wrappers to block and take full width */
          .app-layout, .main-content, .invoice-page-container, .invoice-layout {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
          }
          /* Style the invoice exactly for A4 or auto size */
          #printable-invoice {
            box-shadow: none !important;
            border: none !important;
            padding: 1cm !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Générateur de Facture</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <button 
              className="btn" 
              style={{ backgroundColor: '#8B5CF6', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }} 
              onClick={() => setShowSendOptions(!showSendOptions)}
            >
              <span>💳</span> Envoyer au client {showSendOptions ? '▲' : '▼'}
            </button>
            
            {showSendOptions && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '8px', zIndex: 50, width: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn" style={{ width: '100%', backgroundColor: '#6366F1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setShowSendOptions(false); setIsSendModalOpen(true); }} disabled={isSending}>
                  <span>✉️</span> Envoyer une facture
                </button>
                
                {paymentLink ? (
                  <button className="btn" style={{ width: '100%', backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { navigator.clipboard.writeText(paymentLink); alert("Lien copié dans le presse-papier !"); setShowSendOptions(false); }}>
                    <span>📋</span> Lien copié !
                  </button>
                ) : (
                  <button className="btn" style={{ width: '100%', backgroundColor: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setShowSendOptions(false); handleGeneratePaymentLink(); }} disabled={isGeneratingLink}>
                    <span>💳</span> {isGeneratingLink ? 'Création...' : 'Envoyer un lien de paiement'}
                  </button>
                )}
                
                <button className="btn" style={{ width: '100%', backgroundColor: '#F59E0B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { setShowSendOptions(false); handleSendEmail(); }} disabled={isSending}>
                  <span>🚀</span> Les 2 (Facture + Lien)
                </button>
              </div>
            )}
          </div>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', padding: '12px 24px' }}>
            <span>🖨️</span> Imprimer / PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }} className="invoice-layout">
        
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
              <input type="email" className="input" placeholder="Email du client" value={invoiceData.clientEmail} onChange={e => setInvoiceData({...invoiceData, clientEmail: e.target.value})} />
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
              <div style={{ position: 'relative', flex: 1 }}>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="Chercher un équipement ou taper une réf de réservation (ex: #RW0001)..." 
                  value={quickRef}
                  onChange={e => setQuickRef(e.target.value)}
                  style={{ width: '100%', fontSize: '13px' }}
                />
                {quickRef.length > 1 && searchResults.length > 0 && (
                  <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #E5E7EB', borderRadius: '4px', zIndex: 10, listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    {searchResults.map(eq => (
                      <li 
                        key={eq.reference} 
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '13px' }}
                        onMouseDown={() => addEqToInvoice(eq)} // using onMouseDown to fire before input blur if we add blur later
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <strong>{eq.isBooking ? `📦 ${eq.reference}` : eq.reference}</strong> - {eq.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                <input type="number" className="input" placeholder="Prix Unit. TTC" style={{ flex: 1, minWidth: '100px' }} value={item.unitPrice} onChange={e => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} />
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
              {invoiceData.items.map(item => {
                const prixHT = item.unitPrice / (1 + (invoiceData.taxRate / 100));
                const totalHTItem = item.quantity * prixHT;
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '16px 0', fontSize: '15px' }}>{item.description}</td>
                    <td style={{ padding: '16px 0', textAlign: 'center', fontSize: '15px' }}>{item.quantity}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '15px' }}>{prixHT.toFixed(2)} €</td>
                    <td style={{ padding: '16px 0', textAlign: 'right', fontSize: '15px', fontWeight: 500 }}>{totalHTItem.toFixed(2)} €</td>
                  </tr>
                );
              })}
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

        </div>
      </div>
      
      {/* EMAIL SEND MODAL */}
      {isSendModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', color: '#111827' }}>Envoyer la facture</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4B5563' }}>Vérifiez l'adresse email avant l'envoi de la facture générée via Stripe.</p>
            
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label">Email du destinataire</label>
              <input 
                type="email" 
                className="input" 
                value={invoiceData.clientEmail} 
                onChange={e => setInvoiceData({...invoiceData, clientEmail: e.target.value})}
                placeholder="client@email.com"
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn" 
                onClick={() => setIsSendModalOpen(false)} 
                style={{ padding: '10px 16px', backgroundColor: 'white', border: '1px solid #D1D5DB', borderRadius: '6px', cursor: 'pointer', color: '#374151', fontWeight: '500' }}
                disabled={isSending}
              >
                Annuler
              </button>
              <button 
                className="btn" 
                onClick={async () => {
                  await handleSendEmail();
                  setIsSendModalOpen(false);
                }} 
                style={{ padding: '10px 16px', backgroundColor: '#6366F1', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={isSending}
              >
                {isSending ? 'Envoi en cours...' : 'Confirmer l\'envoi'}
              </button>
            </div>
          </div>
        </div>
      )}
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
