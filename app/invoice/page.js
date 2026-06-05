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

const getPricePerDay = (reference, name = '', category = '') => {
  const text = `${reference} ${name} ${category}`.toUpperCase();
  if (text.includes('PACK')) return 40; 
  if (text.includes('WING') || text.includes('FOIL') || text.includes('KITE')) return 25; 
  if (text.includes('BOARD') || text.includes('TWINTIP') || text.includes('PLANCHE') || text.includes('SURF') || text.includes('PADDLE')) return 20; 
  if (text.includes('NEOPRENE') || text.includes('COMBINAISON') || text.includes('HARNAIS')) return 10; 
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
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  // Helper pour calculer le prix à partir des grilles
  const getCalculatedPrice = (ref, days, name = '', category = '') => {
    let finalPrice = 0;
    if (PRICING_GRIDS[ref]) {
      const grid = PRICING_GRIDS[ref];
      let gridDays = days;
      if (gridDays > 31) gridDays = 31;
      finalPrice = gridDays === 0.5 ? grid[0.5] : (grid[Math.floor(gridDays)] || grid[31]);
    } else {
      const perDay = getPricePerDay(ref, name, category);
      finalPrice = days === 0.5 ? Math.round(perDay * 0.6) : perDay * days;
    }
    return finalPrice;
  };

  const PRICING_GRIDS = {
    'LOK-BOARDBAG-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 59.97, 17: 64.96, 18: 69.95, 19: 74.94, 20: 79.93, 21: 61.23, 22: 61.23, 23: 61.23, 24: 61.23, 25: 61.23, 26: 61.23, 27: 61.23, 28: 61.23, 29: 64.98, 30: 64.98, 31: 64.98 },
    'LOK-PACK-KITE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 292.41, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.91, 17: 354.92, 18: 354.93, 19: 354.94, 20: 354.95, 21: 361.15, 22: 361.12, 23: 361.12, 24: 361.12, 25: 361.12, 26: 361.12, 27: 361.12, 28: 373.64, 29: 373.64, 30: 373.62, 31: 373.62 },
    'LOK-PACK-2AILES-BARRE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 292.41, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.91, 17: 354.92, 18: 354.93, 19: 354.94, 20: 354.95, 21: 361.15, 22: 361.12, 23: 361.12, 24: 361.12, 25: 361.12, 26: 361.12, 27: 361.12, 28: 373.64, 29: 373.64, 30: 373.62, 31: 373.62 },
    'LOK-TWINTIP-OPT-CS': { 0.5: 0, 1: 25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
    'LOK-TWINTIP-OPT': { 0.5: 18.75, 1: 25, 2: 43.7, 3: 56.21, 4: 56.22, 5: 56.23, 6: 56.23, 7: 56.23, 8: 62.48, 9: 62.47, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 74.98, 15: 74.98, 16: 74.98, 17: 74.98, 18: 74.98, 19: 74.98, 20: 74.98, 21: 74.98, 22: 74.97, 23: 74.97, 24: 74.97, 25: 74.97, 26: 74.97, 27: 74.97, 28: 62.48, 29: 62.48, 30: 62.48, 31: 62.48 },
    'LOK-BOARD-TWINTIP': { 0.5: 35, 1: 37.5, 2: 43.7, 3: 49.97, 4: 56.22, 5: 62.47, 6: 68.73, 7: 74.98, 8: 81.23, 9: 87.46, 10: 93.71, 11: 99.96, 12: 106.21, 13: 112.46, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.44, 23: 162.44, 24: 162.44, 25: 162.44, 26: 162.44, 27: 162.44, 28: 187.44, 29: 187.45, 30: 187.43, 31: 187.44 },
    'LOK-BOARD-FOIL-WING': { 0.5: 67.5, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 248.68, 8: 258.68, 9: 268.63, 10: 268.63, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 286.17, 16: 286.18, 17: 286.19, 18: 286.2, 19: 286.21, 20: 286.22, 21: 298.67, 22: 298.64, 23: 298.64, 24: 298.64, 25: 298.64, 26: 298.64, 27: 298.64, 28: 298.66, 29: 311.16, 30: 311.14, 31: 311.15 },
    'LOK-WING-BOARD': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 181.2, 8: 184.95, 9: 189.91, 10: 189.91, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.7, 17: 223.71, 18: 223.72, 19: 223.73, 20: 223.74, 21: 248.68, 22: 248.66, 23: 248.66, 24: 248.66, 25: 248.66, 26: 248.66, 27: 248.66, 28: 273.67, 29: 273.67, 30: 273.65, 31: 273.66 },
    'LOK-WING-FOIL': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 181.2, 8: 184.95, 9: 189.91, 10: 189.91, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.7, 17: 223.71, 18: 223.72, 19: 223.73, 20: 223.74, 21: 248.68, 22: 248.66, 23: 248.66, 24: 248.66, 25: 248.66, 26: 248.66, 27: 248.66, 28: 273.67, 29: 273.67, 30: 273.65, 31: 273.66 },
    'LOK-WING-AILE': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 181.2, 8: 184.95, 9: 189.91, 10: 189.91, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.7, 17: 223.71, 18: 223.72, 19: 223.73, 20: 223.74, 21: 248.68, 22: 248.66, 23: 248.66, 24: 248.66, 25: 248.66, 26: 248.66, 27: 248.66, 28: 273.67, 29: 273.67, 30: 273.65, 31: 273.66 },
    'LOK-2WING-AILE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
    'LOK-WING-2AILE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 68.72, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.48, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 89.97, 29: 89.97, 30: 89.97, 31: 89.97 },
    'LOK-HARNAIS-CULOTTE': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 41.22, 4: 56.22, 5: 71.22, 6: 86.22, 7: 101.22, 8: 116.22, 9: 116.2, 10: 116.2, 11: 116.21, 12: 116.21, 13: 116.21, 14: 116.22, 15: 116.22, 16: 116.22, 17: 116.22, 18: 116.22, 19: 116.22, 20: 116.22, 21: 116.22, 22: 116.21, 23: 116.21, 24: 116.21, 25: 116.21, 26: 116.21, 27: 116.21, 28: 116.22, 29: 116.22, 30: 116.21, 31: 116.21 },
    'LOK-3AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
    'LOK-2AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
    'LOK-3AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 56.23, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.48, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 89.97, 29: 89.97, 30: 89.97, 31: 89.97 },
    'LOK-AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 56.23, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.48, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 89.97, 29: 89.97, 30: 89.97, 31: 89.97 },
    'LOK-COMBINAISON-OPT': { 0.5: 46.25, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 59.97, 17: 64.96, 18: 69.95, 19: 74.94, 20: 79.93, 21: 61.23, 22: 61.23, 23: 61.23, 24: 61.23, 25: 61.23, 26: 61.23, 27: 61.23, 28: 61.23, 29: 64.98, 30: 64.98, 31: 64.98 },
    'LOK-NEOPRENE-COMBINAISON': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.23, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.97, 23: 74.97, 24: 74.97, 25: 74.97, 26: 74.97, 27: 74.97, 28: 74.98, 29: 74.98, 30: 77.47, 31: 77.47 },
    'LOK-PACK-WING-GONFLABLE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.63, 8: 398.65, 9: 398.57, 10: 398.57, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.39, 17: 442.4, 18: 442.41, 19: 442.42, 20: 442.43, 21: 442.43, 22: 442.43, 23: 442.43, 24: 442.43, 25: 442.43, 26: 442.43, 27: 442.43, 28: 442.43, 29: 442.43, 30: 442.43, 31: 442.43 },
    'LOK-PACK-WING-RIGIDE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.63, 8: 398.65, 9: 398.57, 10: 398.57, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.39, 17: 442.4, 18: 442.41, 19: 442.42, 20: 442.43, 21: 453.62, 22: 453.59, 23: 453.59, 24: 453.59, 25: 453.59, 26: 453.59, 27: 453.59, 28: 466.11, 29: 466.12, 30: 466.09, 31: 466.09 },
    'LOK-PACK-WING-DEBUTANT': { 0.5: 43.75, 1: 48.75, 2: 86.16, 3: 123.66, 4: 161.17, 5: 198.67, 6: 236.17, 7: 261.17, 8: 286.18, 9: 311.11, 10: 311.11, 11: 348.62, 12: 361.12, 13: 373.63, 14: 386.14, 15: 386.14, 16: 386.14, 17: 386.14, 18: 386.14, 19: 386.14, 20: 386.14, 21: 436.13, 22: 436.09, 23: 436.09, 24: 436.09, 25: 436.09, 26: 436.09, 27: 436.09, 28: 448.62, 29: 448.62, 30: 448.59, 31: 448.6 },
    'LOK-CAGOULE-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 21.24, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 37.49, 29: 37.49, 30: 37.49, 31: 37.49 },
    'LOK-NEOPRENE-CAGOULE': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 24.99, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.73, 23: 43.73, 24: 43.73, 25: 43.73, 26: 43.73, 27: 43.73, 28: 47.49, 29: 47.49, 30: 47.48, 31: 47.48 },
    'LOK-CHAUSSONS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 21.24, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 37.49, 29: 37.49, 30: 37.49, 31: 37.49 },
    'LOK-NEOPRENE-CHAUSSONS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 24.99, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.73, 23: 43.73, 24: 43.73, 25: 43.73, 26: 43.73, 27: 43.73, 28: 47.49, 29: 47.49, 30: 47.48, 31: 47.48 },
    'LOK-GANTS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 21.24, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 37.49, 29: 37.49, 30: 37.49, 31: 37.49 },
    'LOK-NEOPRENE-GANTS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 24.99, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.73, 23: 43.73, 24: 43.73, 25: 43.73, 26: 43.73, 27: 43.73, 28: 47.49, 29: 47.49, 30: 47.48, 31: 47.48 },
    'LOK-HARNAIS-CEINTURE-OPT': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 59.97, 17: 64.96, 18: 69.95, 19: 74.94, 20: 79.93, 21: 61.23, 22: 61.23, 23: 61.23, 24: 61.23, 25: 61.23, 26: 61.23, 27: 61.23, 28: 61.23, 29: 64.98, 30: 64.98, 31: 64.98 },
    'LOK-HARNAIS-CEINTURE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 58.72, 5: 73.72, 6: 88.72, 7: 103.72, 8: 118.72, 9: 118.7, 10: 118.7, 11: 118.71, 12: 118.71, 13: 118.71, 14: 118.71, 15: 118.72, 16: 118.73, 17: 118.74, 18: 118.75, 19: 118.76, 20: 118.77, 21: 118.72, 22: 118.71, 23: 118.71, 24: 118.71, 25: 118.71, 26: 118.71, 27: 118.71, 28: 118.71, 29: 118.72, 30: 118.71, 31: 118.71 },
    'LOK-VESTENEOPRENE-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 59.97, 17: 64.96, 18: 69.95, 19: 74.94, 20: 79.93, 21: 61.23, 22: 61.23, 23: 61.23, 24: 61.23, 25: 61.23, 26: 61.23, 27: 61.23, 28: 61.23, 29: 64.98, 30: 64.98, 31: 64.98 },
    'LOK-NEOPRENE-VESTE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.23, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.97, 23: 74.97, 24: 74.97, 25: 74.97, 26: 74.97, 27: 74.97, 28: 74.98, 29: 74.98, 30: 77.47, 31: 77.47 },
    'LOK-BOARDBAG': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.23, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.97, 23: 74.97, 24: 74.97, 25: 74.97, 26: 74.97, 27: 74.97, 28: 74.98, 29: 74.98, 30: 77.47, 31: 77.47 },
    'LOK-CASQUE-OPT': { 0.5: 6.25, 1: 7.5, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.51, 17: 17.52, 18: 17.53, 19: 17.54, 20: 17.55, 21: 28.74, 22: 18.74, 23: 18.74, 24: 18.74, 25: 18.74, 26: 18.74, 27: 18.74, 28: 21.24, 29: 21.24, 30: 21.24, 31: 21.24 },
    'LOK-PROT-CASQUE': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 22.49, 6: 23.74, 7: 24.99, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.73, 23: 43.73, 24: 43.73, 25: 43.73, 26: 43.73, 27: 43.73, 28: 47.49, 29: 47.49, 30: 47.48, 31: 47.48 },
    'LOK-GILET-OPT': { 0.5: 6.25, 1: 6.25, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.51, 17: 17.52, 18: 17.53, 19: 17.54, 20: 17.55, 21: 24.99, 22: 24.99, 23: 24.99, 24: 24.99, 25: 24.99, 26: 24.99, 27: 24.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
    'LOK-PROT-GILET': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 31.24, 6: 23.74, 7: 24.99, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.73, 23: 43.73, 24: 43.73, 25: 43.73, 26: 43.73, 27: 43.73, 28: 47.49, 29: 47.49, 30: 47.48, 31: 47.48 },
    'LOK-HARNAIS-CULOTTE-OPT': { 0.5: 6.25, 1: 6.25, 2: 9.99, 3: 12.49, 4: 14.99, 5: 16.24, 6: 17.49, 7: 18.74, 8: 18.75, 9: 18.74, 10: 22.49, 11: 22.49, 12: 22.49, 13: 22.49, 14: 26.24, 15: 26.24, 16: 26.24, 17: 26.24, 18: 26.24, 19: 26.24, 20: 26.24, 21: 29.99, 22: 29.99, 23: 29.99, 24: 29.99, 25: 29.99, 26: 29.99, 27: 29.99, 28: 33.74, 29: 33.74, 30: 33.74, 31: 33.74 },
    'LOK-INITIATION-FOIL-TRACTE': { 0.5: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
    'LOK-BARRE': { 0.5: 36.25, 1: 36.25, 2: 37.46, 3: 43.72, 4: 49.97, 5: 56.23, 6: 62.48, 7: 68.73, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 112.46, 14: 112.47, 15: 149.96, 16: 187.45, 17: 224.94, 18: 262.43, 19: 299.92, 20: 337.41, 21: 162.45, 22: 162.44, 23: 162.44, 24: 162.44, 25: 162.44, 26: 162.44, 27: 162.44, 28: 162.45, 29: 162.45, 30: 162.44, 31: 162.45 },
    'LOK-KITEFOIL': { 0.5: 73.75, 1: 86.25, 2: 136.11, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 248.68, 8: 258.68, 9: 267.38, 10: 273.64, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 298.67, 16: 311.18, 17: 323.69, 18: 336.2, 19: 348.71, 20: 361.22, 21: 311.16, 22: 311.14, 23: 311.14, 24: 311.14, 25: 311.14, 26: 311.14, 27: 311.14, 28: 311.16, 29: 311.16, 30: 311.14, 31: 311.15 },
    'LOK-STRAPLESS': { 0.5: 48.75, 1: 48.75, 2: 73.67, 3: 86.19, 4: 98.7, 5: 111.2, 6: 123.71, 7: 148.71, 8: 153.71, 9: 158.68, 10: 161.18, 11: 186.18, 12: 186.19, 13: 186.19, 14: 186.19, 15: 211.19, 16: 236.19, 17: 261.19, 18: 286.19, 19: 311.19, 20: 336.19, 21: 223.69, 22: 223.67, 23: 223.67, 24: 223.67, 25: 223.67, 26: 223.67, 27: 223.67, 28: 223.68, 29: 223.69, 30: 223.67, 31: 223.67 },
    'LOK-PADDLE': { 0.5: 18.75, 1: 50, 2: 49.95, 3: 49.97, 4: 49.97, 5: 56.23, 6: 62.48, 7: 68.73, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 149.95, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.44, 23: 162.44, 24: 162.44, 25: 162.44, 26: 162.44, 27: 162.44, 28: 187.44, 29: 187.45, 30: 187.43, 31: 187.44 },
    'LOK-SURF': { 0.5: 31.25, 1: 37.5, 2: 43.7, 3: 56.21, 4: 68.71, 5: 81.22, 6: 93.72, 7: 106.22, 8: 109.97, 9: 113.7, 10: 117.45, 11: 121.2, 12: 121.21, 13: 121.21, 14: 121.21, 15: 146.21, 16: 171.21, 17: 196.21, 18: 221.21, 19: 246.21, 20: 271.21, 21: 162.45, 22: 162.44, 23: 162.44, 24: 162.44, 25: 162.44, 26: 162.44, 27: 162.44, 28: 162.45, 29: 162.45, 30: 162.44, 31: 162.45 },
    'LOK-AILE-BARRE': { 0.5: 70, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 211.16, 6: 223.67, 7: 236.18, 8: 243.69, 9: 256.13, 10: 261.14, 11: 273.65, 12: 273.65, 13: 273.66, 14: 279.92, 15: 279.92, 16: 279.92, 17: 279.92, 18: 279.92, 19: 279.92, 20: 279.92, 21: 279.92, 22: 279.92, 23: 279.92, 24: 279.92, 25: 279.92, 26: 279.92, 27: 279.92, 28: 279.92, 29: 279.92, 30: 279.92, 31: 279.92 },
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
                description: `Wingboost\nMatériel inclus :\n${equipments.map(e => '- ' + e.name).join('\n')}`,
                quantity: 1,
                duration: days,
                unitPrice: 0
              }];
            } else {
              newItems = equipments.map((itemEq, idx) => {
                const ref = itemEq.reference ? itemEq.reference.replace(/^'/, '') : '';
                let finalPrice = getCalculatedPrice(ref, days, itemEq.name, itemEq.category);
                let descriptionSuffix = ` (${durationDisplay})`;
                
                return {
                  id: Date.now() + idx,
                  reference: ref,
                  description: (itemEq.name || 'Équipement importé') + descriptionSuffix,
                  quantity: 1,
                  duration: days,
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
              duration: 1,
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
            duration: 1,
            unitPrice: getCalculatedPrice(eq.reference ? eq.reference.replace(/^'/, '') : '', 1, eq.name, eq.category) 
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
      items: [...invoiceData.items, { id: Date.now(), reference: '', description: '', quantity: 1, duration: 1, unitPrice: 0 }]
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
        
        if (field === 'reference' && value) {
          const eq = GENERIC_EQUIPMENTS.find(e => e.reference === value);
          if (eq) {
            if (!updated.description || updated.description.trim() === '') {
              updated.description = eq.name;
            }
            const dur = updated.duration || 1;
            updated.unitPrice = getCalculatedPrice(eq.reference, dur, updated.description, updated.category);
          }
        } else if (field === 'duration' && updated.reference) {
          updated.unitPrice = getCalculatedPrice(updated.reference, value, updated.description, updated.category || '');
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
              onClick={() => setIsSendModalOpen(true)}
            >
              <span>💳</span> Envoyer au client
            </button>
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
                <textarea className="input" placeholder="Description" rows={2} style={{ flex: 3, minWidth: '200px', resize: 'vertical' }} value={item.description} onChange={e => handleItemChange(item.id, 'description', e.target.value)} />
                <select 
                  className="input" 
                  style={{ flex: 1, minWidth: '100px' }} 
                  value={item.duration || 1} 
                  onChange={e => handleItemChange(item.id, 'duration', parseFloat(e.target.value))}
                >
                  <option value={0.5}>½ Jour</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} Jour{i+1 > 1 ? 's' : ''}</option>
                  ))}
                </select>
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
                    <td style={{ padding: '16px 0', fontSize: '15px', whiteSpace: 'pre-wrap' }}>{item.description}</td>
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
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '12px', width: '500px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#111827' }}>💳 Envoyer au client</h2>
              <button onClick={() => setIsSendModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6B7280' }}>✕</button>
            </div>
            
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#4B5563' }}>Vérifiez l'adresse email et choisissez le mode d'envoi via Stripe.</p>
            
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn" 
                onClick={async () => {
                  await handleSendEmail();
                  setIsSendModalOpen(false);
                }} 
                style={{ padding: '12px', backgroundColor: '#6366F1', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                disabled={isSending}
              >
                <span>✉️</span> {isSending ? 'Envoi en cours...' : 'Envoyer la facture par email'}
              </button>

              {paymentLink ? (
                  <button className="btn" style={{ width: '100%', backgroundColor: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => { navigator.clipboard.writeText(paymentLink); alert("Lien copié dans le presse-papier !"); }}>
                    <span>📋</span> Lien copié ! ({paymentLink.substring(0, 30)}...)
                  </button>
                ) : (
                  <button className="btn" style={{ width: '100%', backgroundColor: '#3B82F6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleGeneratePaymentLink()} disabled={isGeneratingLink}>
                    <span>💳</span> {isGeneratingLink ? 'Création...' : 'Créer un lien de paiement (sans email)'}
                  </button>
                )}

              <button 
                className="btn" 
                onClick={async () => {
                  await handleSendEmail();
                  setIsSendModalOpen(false);
                }} 
                style={{ padding: '12px', backgroundColor: '#F59E0B', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                disabled={isSending}
              >
                <span>🚀</span> Les 2 (Facture + Lien par email)
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
