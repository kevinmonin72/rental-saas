'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const GENERIC_EQUIPMENTS = [
  { reference: 'LOK-BOARDBAG-OPT', name: 'Boardbag opt.', category: 'Accessoires', quantity: 15 },
  { reference: 'LOK-PACK-KITE', name: 'Pack Kitesurf - à personnaliser ', category: 'Kitesurf', quantity: 50 },
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

  { reference: 'LOK-BARRE', name: 'Barre', category: 'Kitesurf', quantity: 50 },
  { reference: 'LOK-KITEFOIL', name: 'Kitefoil', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-STRAPLESS', name: 'Strapless', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-TWINTIP-OPT', name: 'Planche Twintip Opt.', category: 'Kitesurf', quantity: 20 },
  { reference: 'LOK-BOARD-FOIL-WING', name: 'Planche + Foil de Wing', category: 'Wingfoil', quantity: 49 },
  { reference: 'LOK-PADDLE', name: 'Paddle', category: 'Autres', quantity: 25 },
  { reference: 'LOK-SURF', name: 'Surf', category: 'Autres', quantity: 50 }];

const CATEGORY_ICONS = {
  Kitesurf: '',
  Wingfoil: '',
  Néoprène: '',
  Accessoires: '',
  Protections: '️',
  'Carte Session': '️',
  Autres: ''
};



const getPricePerDay = (reference) => {
  if (reference.includes('PACK')) return 40; // Packs: 40€/jour
  if (reference.includes('WING') || reference.includes('FOIL') || reference.includes('KITE')) return 25; // Ailes/Foils: 25€/jour
  if (reference.includes('BOARD') || reference.includes('TWINTIP')) return 20; // Planches: 20€/jour
  if (reference.includes('NEOPRENE') || reference.includes('COMBINAISON')) return 10; // Néoprène: 10€/jour
  return 10; // Reste (accessoires, gilets, etc.): 10€/jour
};

export default function PublicBookingPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [error, setError] = useState('');
  
  // DB Data
  const [equipmentList, setEquipmentList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingItems, setBookingItems] = useState([]);

  // Form State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rentalType, setRentalType] = useState('ponctuel');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Customer Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Form State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Fetch all inventory and active bookings, and ensure generic items exist
  useEffect(() => {
    async function loadData() {
      try {
        const [eqRes, bookRes, itemsRes] = await Promise.all([
          supabase.from('equipment').select('*'),
          supabase.from('bookings').select('*').eq('status', 'active'),
          supabase.from('booking_items').select('*')]);

        if (eqRes.error) throw eqRes.error;
        if (bookRes.error) throw bookRes.error;
        if (itemsRes.error) throw itemsRes.error;

        let dbEquipments = eqRes.data || [];
        dbEquipments = dbEquipments.filter(e => e.reference !== 'LOK-INITIATION-FOIL-TRACTE');
        const missingGenerics = [];

        // Identify which generic equipment categories are missing in the DB
        for (const item of GENERIC_EQUIPMENTS) {
          const match = dbEquipments.find(e => e.reference === item.reference);
          if (!match) {
            missingGenerics.push({
              id: uuidv4(),
              reference: item.reference,
              name: item.name,
              category: item.category,
              quantity: item.quantity
            });
          } else if (match.quantity !== item.quantity) {
            // Update quantity if it differs to match Lokki stock changes
            await supabase.from('equipment').update({ quantity: item.quantity }).eq('id', match.id);
            match.quantity = item.quantity;
          }
        }

        // Insert missing generic items so the DB is self-healing
        if (missingGenerics.length > 0) {
          const { data: inserted, error: insertErr } = await supabase
            .from('equipment')
            .insert(missingGenerics)
            .select();
          
          if (insertErr) throw insertErr;
          dbEquipments = [...dbEquipments, ...(inserted || [])];
        }

        setEquipmentList(dbEquipments);
        setBookings(bookRes.data || []);
        setBookingItems(itemsRes.data || []);

        // Check if publishable key is defined
        if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
          setIsStripeConfigured(true);
        }
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du catalogue. Veuillez réessayer.');
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  const getBookingDuration = () => {
    if (rentalType === 'demi_matin' || rentalType === 'demi_aprem') return 0.5;
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const PRICING_GRIDS = {
  'LOK-BOARDBAG-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-PACK-KITE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 306.17, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.9, 17: 354.9, 18: 354.9, 19: 354.9, 20: 354.9, 21: 361.14, 22: 361.14, 23: 361.14, 24: 361.14, 25: 361.14, 26: 361.14, 27: 361.14, 28: 361.14, 29: 361.14, 30: 361.14, 31: 361.14 },
  'LOK-PACK-2AILES-BARRE': { 0.5: 92.5, 1: 98.75, 2: 167.33, 3: 229.84, 4: 254.87, 5: 267.39, 6: 279.9, 7: 306.17, 8: 306.17, 9: 318.6, 10: 336.11, 11: 348.62, 12: 348.63, 13: 348.64, 14: 354.89, 15: 354.9, 16: 354.9, 17: 354.9, 18: 354.9, 19: 354.9, 20: 354.9, 21: 361.14, 22: 361.14, 23: 361.14, 24: 361.14, 25: 361.14, 26: 361.14, 27: 361.14, 28: 361.14, 29: 361.14, 30: 361.14, 31: 361.14 },
  'LOK-TWINTIP-OPT-CS': { 0.5: 0, 1: 25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-TWINTIP-OPT': { 0.5: 18.75, 1: 25, 2: 43.7, 3: 56.21, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 62.47, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 74.98, 15: 74.98, 16: 74.98, 17: 74.98, 18: 74.98, 19: 74.98, 20: 74.98, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-BOARD-TWINTIP': { 0.5: 35, 1: 37.5, 2: 43.7, 3: 49.97, 4: 56.22, 5: 62.47, 6: 68.73, 7: 81.23, 8: 81.23, 9: 87.46, 10: 93.71, 11: 99.96, 12: 106.21, 13: 112.46, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.45, 23: 162.45, 24: 162.45, 25: 162.45, 26: 162.45, 27: 162.45, 28: 162.45, 29: 162.45, 30: 162.45, 31: 162.45 },
  'LOK-BOARD-FOIL-WING': { 0.5: 67.5, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 258.68, 8: 258.68, 9: 268.63, 10: 0, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 286.17, 16: 286.17, 17: 286.17, 18: 286.17, 19: 286.17, 20: 286.17, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-BOARD': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-FOIL': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-AILE': { 0.5: 55, 1: 61.25, 2: 74.92, 3: 99.93, 4: 124.93, 5: 143.69, 6: 162.44, 7: 184.95, 8: 184.95, 9: 189.91, 10: 0, 11: 199.92, 12: 199.93, 13: 199.94, 14: 223.68, 15: 223.69, 16: 223.69, 17: 223.69, 18: 223.69, 19: 223.69, 20: 223.69, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-2WING-AILE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-WING-2AILE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 0, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-HARNAIS-CULOTTE': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 41.22, 4: 56.22, 5: 71.22, 6: 86.22, 7: 116.22, 8: 116.22, 9: 116.2, 10: 116.2, 11: 116.21, 12: 116.21, 13: 116.21, 14: 116.22, 15: 116.22, 16: 116.22, 17: 116.22, 18: 116.22, 19: 116.22, 20: 116.22, 21: 116.22, 22: 116.22, 23: 116.22, 24: 116.22, 25: 116.22, 26: 116.22, 27: 116.22, 28: 116.22, 29: 116.22, 30: 116.22, 31: 116.22 },
  'LOK-3AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-2AILE-SANSBARRE-CS': { 0.5: 0, 1: 31.25, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-3AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.47, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 87.47, 29: 87.47, 30: 87.47, 31: 87.47 },
  'LOK-AILE-SANSBARRE': { 0.5: 31.25, 1: 31.25, 2: 43.7, 3: 49.97, 4: 56.22, 5: 56.23, 6: 56.23, 7: 62.48, 8: 62.48, 9: 68.72, 10: 74.97, 11: 74.97, 12: 74.97, 13: 74.98, 14: 81.23, 15: 81.23, 16: 81.23, 17: 81.23, 18: 81.23, 19: 81.23, 20: 81.23, 21: 87.47, 22: 87.47, 23: 87.47, 24: 87.47, 25: 87.47, 26: 87.47, 27: 87.47, 28: 87.47, 29: 87.47, 30: 87.47, 31: 87.47 },
  'LOK-COMBINAISON-OPT': { 0.5: 46.25, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-NEOPRENE-COMBINAISON': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-PACK-WING-GONFLABLE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.65, 8: 398.65, 9: 398.57, 10: 0, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.38, 17: 442.38, 18: 442.38, 19: 442.38, 20: 442.38, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-PACK-WING-RIGIDE': { 0.5: 86.25, 1: 98.75, 2: 173.57, 3: 236.09, 4: 286.1, 5: 336.11, 6: 373.62, 7: 398.65, 8: 398.65, 9: 398.57, 10: 0, 11: 436.08, 12: 436.1, 13: 436.11, 14: 442.37, 15: 442.38, 16: 442.38, 17: 442.38, 18: 442.38, 19: 442.38, 20: 442.38, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-PACK-WING-DEBUTANT': { 0.5: 43.75, 1: 48.75, 2: 86.16, 3: 123.66, 4: 161.17, 5: 198.67, 6: 236.17, 7: 286.18, 8: 286.18, 9: 311.11, 10: 0, 11: 348.62, 12: 361.12, 13: 373.63, 14: 386.14, 15: 386.14, 16: 386.14, 17: 386.14, 18: 386.14, 19: 386.14, 20: 386.14, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-CAGOULE-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-CAGOULE': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-CHAUSSONS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-CHAUSSONS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-GANTS-OPT': { 0.5: 6.25, 1: 8.75, 2: 14.98, 3: 16.24, 4: 17.49, 5: 18.74, 6: 19.99, 7: 22.49, 8: 22.49, 9: 23.74, 10: 24.99, 11: 24.99, 12: 24.99, 13: 24.99, 14: 29.99, 15: 29.99, 16: 29.99, 17: 29.99, 18: 29.99, 19: 29.99, 20: 29.99, 21: 34.99, 22: 34.99, 23: 34.99, 24: 34.99, 25: 34.99, 26: 34.99, 27: 34.99, 28: 34.99, 29: 34.99, 30: 34.99, 31: 34.99 },
  'LOK-NEOPRENE-GANTS': { 0.5: 6.25, 1: 11.25, 2: 18.73, 3: 19.99, 4: 21.24, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-HARNAIS-CEINTURE-OPT': { 0.5: 18.75, 1: 23.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-HARNAIS-CEINTURE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 58.72, 5: 73.72, 6: 88.72, 7: 118.72, 8: 118.72, 9: 118.7, 10: 118.7, 11: 118.71, 12: 118.71, 13: 118.71, 14: 118.71, 15: 118.72, 16: 118.72, 17: 118.72, 18: 118.72, 19: 118.72, 20: 118.72, 21: 118.71, 22: 118.71, 23: 118.71, 24: 118.71, 25: 118.71, 26: 118.71, 27: 118.71, 28: 118.71, 29: 118.71, 30: 118.71, 31: 118.71 },
  'LOK-VESTENEOPRENE-OPT': { 0.5: 12.5, 1: 18.75, 2: 31.22, 3: 34.98, 4: 38.73, 5: 42.48, 6: 44.98, 7: 44.99, 8: 44.99, 9: 44.98, 10: 49.98, 11: 49.98, 12: 49.98, 13: 49.98, 14: 49.99, 15: 54.98, 16: 54.98, 17: 54.98, 18: 54.98, 19: 54.98, 20: 54.98, 21: 54.98, 22: 54.98, 23: 54.98, 24: 54.98, 25: 54.98, 26: 54.98, 27: 54.98, 28: 54.98, 29: 54.98, 30: 54.98, 31: 54.98 },
  'LOK-NEOPRENE-VESTE': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-BOARDBAG': { 0.5: 18.75, 1: 23.75, 2: 36.21, 3: 43.72, 4: 48.72, 5: 52.48, 6: 56.23, 7: 56.24, 8: 56.24, 9: 56.22, 10: 56.23, 11: 62.48, 12: 62.48, 13: 62.48, 14: 68.73, 15: 68.73, 16: 68.73, 17: 68.73, 18: 68.73, 19: 68.73, 20: 68.73, 21: 74.98, 22: 74.98, 23: 74.98, 24: 74.98, 25: 74.98, 26: 74.98, 27: 74.98, 28: 74.98, 29: 74.98, 30: 74.98, 31: 74.98 },
  'LOK-CASQUE-OPT': { 0.5: 6.25, 1: 7.5, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.5, 17: 17.5, 18: 17.5, 19: 17.5, 20: 17.5, 21: 28.74, 22: 28.74, 23: 28.74, 24: 28.74, 25: 28.74, 26: 28.74, 27: 28.74, 28: 28.74, 29: 28.74, 30: 28.74, 31: 28.74 },
  'LOK-PROT-CASQUE': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 22.49, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-GILET-OPT': { 0.5: 6.25, 1: 6.25, 2: 7.49, 3: 7.49, 4: 7.5, 5: 7.5, 6: 7.5, 7: 11.25, 8: 11.25, 9: 11.24, 10: 11.25, 11: 11.25, 12: 11.25, 13: 11.25, 14: 17.49, 15: 17.5, 16: 17.5, 17: 17.5, 18: 17.5, 19: 17.5, 20: 17.5, 21: 24.99, 22: 24.99, 23: 24.99, 24: 24.99, 25: 24.99, 26: 24.99, 27: 24.99, 28: 24.99, 29: 24.99, 30: 24.99, 31: 24.99 },
  'LOK-PROT-GILET': { 0.5: 11.25, 1: 18.75, 2: 22.48, 3: 24.98, 4: 27.49, 5: 31.24, 6: 23.74, 7: 27.49, 8: 27.49, 9: 29.99, 10: 31.24, 11: 31.24, 12: 31.24, 13: 31.24, 14: 37.49, 15: 37.49, 16: 37.49, 17: 37.49, 18: 37.49, 19: 37.49, 20: 37.49, 21: 43.74, 22: 43.74, 23: 43.74, 24: 43.74, 25: 43.74, 26: 43.74, 27: 43.74, 28: 43.74, 29: 43.74, 30: 43.74, 31: 43.74 },
  'LOK-HARNAIS-CULOTTE-OPT': { 0.5: 6.25, 1: 6.25, 2: 9.99, 3: 12.49, 4: 14.99, 5: 16.24, 6: 17.49, 7: 18.75, 8: 18.75, 9: 18.74, 10: 22.49, 11: 22.49, 12: 22.49, 13: 22.49, 14: 26.24, 15: 26.24, 16: 26.24, 17: 26.24, 18: 26.24, 19: 26.24, 20: 26.24, 21: 29.99, 22: 29.99, 23: 29.99, 24: 29.99, 25: 29.99, 26: 29.99, 27: 29.99, 28: 29.99, 29: 29.99, 30: 29.99, 31: 29.99 },
  'LOK-INITIATION-FOIL-TRACTE': { 0.5: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, 11: 0, 12: 0, 13: 0, 14: 0, 15: 0, 16: 0, 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, 22: 0, 23: 0, 24: 0, 25: 0, 26: 0, 27: 0, 28: 0, 29: 0, 30: 0, 31: 0 },
  'LOK-BARRE': { 0.5: 36.25, 1: 36.25, 2: 37.46, 3: 43.72, 4: 49.97, 5: 56.23, 6: 62.48, 7: 74.98, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 112.46, 14: 112.47, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 149.96, 22: 149.96, 23: 149.96, 24: 149.96, 25: 149.96, 26: 149.96, 27: 149.96, 28: 149.96, 29: 149.96, 30: 149.96, 31: 149.96 },
  'LOK-KITEFOIL': { 0.5: 73.75, 1: 86.25, 2: 136.11, 3: 173.63, 4: 198.65, 5: 223.66, 6: 236.17, 7: 258.68, 8: 258.68, 9: 267.38, 10: 273.64, 11: 286.14, 12: 286.15, 13: 286.16, 14: 286.16, 15: 298.67, 16: 298.67, 17: 298.67, 18: 298.67, 19: 298.67, 20: 298.67, 21: 298.66, 22: 298.66, 23: 298.66, 24: 298.66, 25: 298.66, 26: 298.66, 27: 298.66, 28: 298.66, 29: 298.66, 30: 298.66, 31: 298.66 },
  'LOK-STRAPLESS': { 0.5: 48.75, 1: 48.75, 2: 73.67, 3: 86.19, 4: 98.7, 5: 111.2, 6: 123.71, 7: 153.71, 8: 153.71, 9: 158.68, 10: 161.18, 11: 186.18, 12: 186.19, 13: 186.19, 14: 186.19, 15: 211.19, 16: 211.19, 17: 211.19, 18: 211.19, 19: 211.19, 20: 211.19, 21: 211.19, 22: 211.19, 23: 211.19, 24: 211.19, 25: 211.19, 26: 211.19, 27: 211.19, 28: 211.19, 29: 211.19, 30: 211.19, 31: 211.19 },
  'LOK-PADDLE': { 0.5: 18.75, 1: 50, 2: 49.95, 3: 49.97, 4: 49.97, 5: 56.23, 6: 62.48, 7: 74.98, 8: 74.98, 9: 81.21, 10: 87.46, 11: 112.46, 12: 112.46, 13: 149.95, 14: 149.96, 15: 149.96, 16: 149.96, 17: 149.96, 18: 149.96, 19: 149.96, 20: 149.96, 21: 162.45, 22: 162.45, 23: 162.45, 24: 162.45, 25: 162.45, 26: 162.45, 27: 162.45, 28: 162.45, 29: 162.45, 30: 162.45, 31: 162.45 },
  'LOK-SURF': { 0.5: 31.25, 1: 37.5, 2: 43.7, 3: 56.21, 4: 68.71, 5: 81.22, 6: 93.72, 7: 109.97, 8: 109.97, 9: 113.7, 10: 117.45, 11: 121.2, 12: 121.21, 13: 121.21, 14: 121.21, 15: 146.21, 16: 146.21, 17: 146.21, 18: 146.21, 19: 146.21, 20: 146.21, 21: 146.21, 22: 146.21, 23: 146.21, 24: 146.21, 25: 146.21, 26: 146.21, 27: 146.21, 28: 146.21, 29: 146.21, 30: 146.21, 31: 146.21 },
  'LOK-AILE-BARRE': { 0.5: 70, 1: 73.75, 2: 123.62, 3: 173.63, 4: 198.65, 5: 211.16, 6: 223.67, 7: 243.69, 8: 243.69, 9: 256.13, 10: 261.14, 11: 273.65, 12: 273.65, 13: 273.66, 14: 279.92, 15: 279.92, 16: 279.92, 17: 279.92, 18: 279.92, 19: 279.92, 20: 279.92, 21: 279.92, 22: 279.92, 23: 279.92, 24: 279.92, 25: 279.92, 26: 279.92, 27: 279.92, 28: 279.92, 29: 279.92, 30: 279.92, 31: 279.92 },
};

  const getItemPrice = (reference, days, rentalType) => {
    if (PRICING_GRIDS[reference]) {
      const grid = PRICING_GRIDS[reference];
      let gridDays = days;
      if (gridDays > 31) gridDays = 31;
      
      if (rentalType === 'demi_matin' || rentalType === 'demi_aprem') {
        return grid[0.5];
      } else {
        return grid[Math.floor(gridDays)] || grid[31];
      }
    } else {
      const pricePerDay = getPricePerDay(reference);
      return (rentalType === 'demi_matin' || rentalType === 'demi_aprem') ? Math.round(pricePerDay * 0.6) : pricePerDay * days;
    }
  };

  const getBookingTotal = () => {
    const days = getBookingDuration();
    if (days === 0 || selectedEquipmentIds.length === 0) return 0;
    
    let subtotal = 0;
    
    for (const eqId of selectedEquipmentIds) {
      const item = equipmentList.find(e => e.id === eqId);
      if (item) {
        subtotal += getItemPrice(item.reference, days, rentalType);
      }
    }
    
    if (appliedPromo) {
      if (appliedPromo.discount_type === 'percentage') {
        subtotal = subtotal * (1 - appliedPromo.discount_value / 100);
      } else if (appliedPromo.discount_type === 'amount') {
        subtotal = subtotal - appliedPromo.discount_value;
      }
    }
    
    return Math.max(0, Math.round(subtotal * 100) / 100);
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    setPromoError('');
    
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', promoInput.trim().toUpperCase())
      .maybeSingle();
      
    if (error || !data) {
      setPromoError('Code promo invalide.');
    } else if (!data.is_active) {
      setPromoError('Ce code promo est inactif.');
    } else if (data.max_uses && data.used_count >= data.max_uses) {
      setPromoError("Ce code promo a atteint son nombre maximum d'utilisations.");
    } else if (data.target_email && data.target_email.toLowerCase() !== email.trim().toLowerCase()) {
      setPromoError("Ce code promo n'est pas valide pour cette adresse email.");
    } else {
      setAppliedPromo(data);
      setPromoError('');
    }
    setValidatingPromo(false);
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!startDate) {
      setError('Veuillez sélectionner la date de début.');
      return;
    }
    if (endDate && new Date(endDate) < new Date(startDate)) {
      setError('La date de fin doit être postérieure ou égale à la date de début.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedEquipmentIds.length === 0) {
      setError('Veuillez sélectionner au moins un type de matériel pour continuer.');
      return;
    }
    setError('');
    setStep(3);
  };

  // Helper: check quantity of equipment available for selected dates
  const getAvailableQuantity = (eqId) => {
    if (!startDate || !endDate) return 0;
    const sNew = new Date(startDate);
    sNew.setHours(0,0,0,0);
    const eNew = new Date(endDate);
    eNew.setHours(23,59,59,999);
    
    if (eNew < sNew) return 0;

    const overlappingBookingsCount = bookings.filter(b => {
      const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
      if (!bItems.some(bi => bi.equipment_id === eqId)) return false;

      const sExist = new Date(b.start_date);
      sExist.setHours(0,0,0,0);
      const eExist = new Date(b.end_date);
      
      if (b.pause_start && b.pause_end) {
        const ps = new Date(b.pause_start);
        const pe = new Date(b.pause_end);
        if (pe >= ps) {
          const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
          eExist.setDate(eExist.getDate() + diffDays);
        }
      }
      eExist.setHours(23,59,59,999);

      return (sNew <= eExist && sExist <= eNew);
    }).length;

    const eq = equipmentList.find(e => e.id === eqId);
    const totalQty = eq ? (parseInt(eq.quantity, 10) || 1) : 1;
    return Math.max(0, totalQty - overlappingBookingsCount);
  };

  const handleAddItem = (id) => {
    const qty = getAvailableQuantity(id);
    if (qty === 0) {
      alert('Cet équipement est déjà réservé sur cette période.');
      return;
    }
    setSelectedEquipmentIds(prev => [...prev, id]);
  };

  const handleRemoveItem = (id) => {
    setSelectedEquipmentIds(prev => {
      const idx = prev.lastIndexOf(id);
      if (idx !== -1) {
        const copy = [...prev];
        copy.splice(idx, 1);
        return copy;
      }
      return prev;
    });
  };

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '));
    } else {
      setCardNumber(value);
    }
  };

  const handleExpiryChange = (e) => {
    let cleanValue = e.target.value.replace(/[^0-9]/g, '');
    if (cleanValue.length > 2) {
      cleanValue = `${cleanValue.substring(0, 2)} / ${cleanValue.substring(2, 4)}`;
    }
    setExpiry(cleanValue);
  };

  const handleCvcChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCvc(value.substring(0, 4));
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      setError('Veuillez renseigner votre prénom, nom et email.');
      return;
    }

    if (!cardNumber || !expiry || !cvc) {
      setError('Veuillez remplir les informations de votre carte bancaire.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Create PaymentIntent through our API (Simulated or Real)
      const selectedRefs = selectedEquipmentIds.map(id => {
        const item = equipmentList.find(e => e.id === id);
        return item ? item.reference : '';
      }).filter(Boolean);

      const piRes = await fetch('/api/stripe/payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentReferences: selectedRefs,
          startDate,
          endDate,
          rentalType,
          promoCode: appliedPromo ? appliedPromo.code : null,
          email: email.trim().toLowerCase()
        })
      });

      if (!piRes.ok) {
        throw new Error('Échec de la connexion à la plateforme de paiement Stripe.');
      }

      const piData = await piRes.json();

      // 2. Perform Payment processing simulation or real charge
      if (piData.mock) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("Paiement simulé validé avec succès.");
      } else {
        const stripe = window.Stripe ? window.Stripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;
        if (!stripe) {
          throw new Error('Erreur de chargement du module Stripe.');
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 3. Find or create Customer in Supabase
      let customerId = null;
      const { data: existingCust, error: searchErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (searchErr) throw searchErr;

      if (existingCust) {
        customerId = existingCust.id;
        if (phone) {
          await supabase.from('customers').update({ phone: phone.trim() }).eq('id', customerId);
        }
      } else {
        customerId = uuidv4();
        const { error: custErr } = await supabase.from('customers').insert([{
          id: customerId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null
        }]);
        if (custErr) throw custErr;
      }

      // 4. Create Booking
      const bookingId = uuidv4();
      const { error: bookErr } = await supabase.from('bookings').insert([{
        id: bookingId,
        customer_id: customerId,
        start_date: startDate,
        end_date: endDate,
        status: 'active',
        shopify_transfer: false,
        rental_type: rentalType
      }]);

      if (bookErr) throw bookErr;

      // 5. Create Booking Items for each chosen type of gear
      const itemCounts = {};
      selectedEquipmentIds.forEach(id => {
        itemCounts[id] = (itemCounts[id] || 0) + 1;
      });

      const items = Object.entries(itemCounts).map(([eqId, qty]) => ({
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: eqId,
        quantity: qty
      }));

      const { error: itemsErr } = await supabase.from('booking_items').insert(items);
      if (itemsErr) throw itemsErr;

      // Increment promo code usage if applied
      if (appliedPromo) {
        await supabase.from('promo_codes').update({ used_count: appliedPromo.used_count + 1 }).eq('id', appliedPromo.id);
      }

      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la transaction. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'sans-serif', color: '#4B5563', fontWeight: 500 }}>Chargement du catalogue...</span>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Script Stripe loader if configured */}
      {isStripeConfigured && (
        <script src="https://js.stripe.com/v3/" async></script>)}

      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid var(--border-color)', padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="The Ridery Logo" style={{ height: '32px', objectFit: 'contain' }} />
          </div>
          <span className="badge" style={{ fontSize: '13px', fontWeight: 500 }}>
            Portail Client
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '40px auto', padding: '0 24px 80px 24px' }}>
        
        {/* Progress Wizard Header */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '40px', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 1 ? '#F97316' : '#D1D5DB', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>1</span>
              <span style={{ fontWeight: step === 1 ? 'bold' : 'normal', color: step === 1 ? '#111827' : '#6B7280', fontSize: '14px' }}>Dates</span>
            </div>
            <div style={{ width: '40px', height: '2px', backgroundColor: step >= 2 ? '#F97316' : '#D1D5DB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 2 ? '#F97316' : '#D1D5DB', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>2</span>
              <span style={{ fontWeight: step === 2 ? 'bold' : 'normal', color: step === 2 ? '#111827' : '#6B7280', fontSize: '14px' }}>Matériel</span>
            </div>
            <div style={{ width: '40px', height: '2px', backgroundColor: step >= 3 ? '#F97316' : '#D1D5DB' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', backgroundColor: step >= 3 ? '#F97316' : '#D1D5DB', color: 'white', fontSize: '14px', fontWeight: 'bold' }}>3</span>
              <span style={{ fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? '#111827' : '#6B7280', fontSize: '14px' }}>Coordonnées & Paiement</span>
            </div>
          </div>)}

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '14px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
            ️ {error}
          </div>)}

        <div style={{ display: 'grid', gridTemplateColumns: step === 4 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          
          {/* Main Card */}
          <div className="card" style={{ padding: '32px' }}>
            
            {/* STEP 1: DATES */}
            {step === 1 && (
              <form onSubmit={handleNextStep1}>
                <h2 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>Sélectionnez votre formule de location</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Date de début</label>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setStartDate(val);
                        if (val) {
                          if (rentalType === 'demi_matin' || rentalType === 'demi_aprem' || rentalType === '1_jour' || rentalType === 'ponctuel' || rentalType === 'journee') {
                            setEndDate(val);
                          } else if (rentalType && rentalType.endsWith('_jours')) {
                            const days = parseInt(rentalType.split('_')[0]);
                            const start = new Date(val);
                            start.setDate(start.getDate() + days - 1);
                            setEndDate(start.toISOString().split('T')[0]);
                          }
                        }
                      }} 
                      style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Durée</label>
                    <select 
                      className="input" 
                      value={rentalType === 'ponctuel' || rentalType === 'journee' ? '1_jour' : rentalType}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRentalType(val);
                        if (val === 'demi_matin' || val === 'demi_aprem' || val === '1_jour') {
                          if (startDate) setEndDate(startDate);
                        } else if (val.endsWith('_jours')) {
                          const days = parseInt(val.split('_')[0]);
                          if (startDate) {
                            const start = new Date(startDate);
                            start.setDate(start.getDate() + days - 1);
                            setEndDate(start.toISOString().split('T')[0]);
                          }
                        }
                      }}
                      style={{ padding: '12px 14px', width: '100%' }}
                      required
                    >
                      <option value="demi_matin">️ ½j (Matin)</option>
                      <option value="demi_aprem"> ½j (Aprem)</option>
                      <option value="1_jour">1 Jour</option>
                      {[...Array(30)].map((_, i) => {
                        const days = i + 2;
                        return <option key={days} value={`${days}_jours`}>{days} Jours</option>;
                      })}
                    </select>
                  </div>
                </div>

                <button type="submit" className="premium-btn" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', fontSize: '16px', marginTop: '16px', cursor: 'pointer' }}>
                  Rechercher le matériel disponible →
                </button>
              </form>)}

            {/* STEP 2: SELECT EQUIPMENT TYPES */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Choisissez votre matériel</h2>
                  <button onClick={() => setStep(1)} style={{ color: '#F97316', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Modifier dates</button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder=" Rechercher un modèle..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                </div>

                {/* Category Navigation Tabs */}
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px', scrollbarWidth: 'none' }} className="no-scrollbar">
                  <button 
                    onClick={() => setActiveCategory('All')}
                    style={{ 
                      padding: '8px 16px', 
                      backgroundColor: activeCategory === 'All' ? '#F97316' : 'white', 
                      color: activeCategory === 'All' ? 'white' : '#4B5563', 
                      borderRadius: '20px', 
                      fontSize: '13px', 
                      fontWeight: 600, 
                      border: '1px solid #D1D5DB',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s'
                    }}
                  >
                     Tous ({equipmentList.length})
                  </button>
                  {Object.keys(CATEGORY_ICONS).map(cat => {
                    const count = equipmentList.filter(e => {
                      const gen = GENERIC_EQUIPMENTS.find(g => g.reference === e.reference);
                      return gen && gen.category === cat;
                    }).length;
                    
                    if (count === 0) return null;

                    return (
                      <button 
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{ 
                          padding: '8px 16px', 
                          backgroundColor: activeCategory === cat ? '#F97316' : 'white', 
                          color: activeCategory === cat ? 'white' : '#4B5563', 
                          borderRadius: '20px', 
                          fontSize: '13px', 
                          fontWeight: 600, 
                          border: '1px solid #D1D5DB',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s'
                        }}
                      >
                        {CATEGORY_ICONS[cat]} {cat} ({count})
                      </button>);
                  })}
                </div>

                {/* Grouped Equipment Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
                  {Object.keys(CATEGORY_ICONS).map(cat => {
                    if (activeCategory !== 'All' && activeCategory !== cat) return null;

                    const catEquipments = equipmentList.filter(e => {
                      const gen = GENERIC_EQUIPMENTS.find(g => g.reference === e.reference);
                      return gen && gen.category === cat && 
                             (searchQuery === '' || e.name.toLowerCase().includes(searchQuery.toLowerCase()));
                    });

                    if (catEquipments.length === 0) return null;

                    return (
                      <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                          <span>{CATEGORY_ICONS[cat]}</span> {cat}
                        </h3>
                        
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(4, 1fr)', 
                          gap: '12px' 
                        }}>
                          {catEquipments.map(e => {
                            const qtySelected = selectedEquipmentIds.filter(id => id === e.id).length;
                            const isSelected = qtySelected > 0;
                            const qtyAvailable = getAvailableQuantity(e.id);
                            const isOutOfStock = qtyAvailable === 0 && !isSelected;
                            const pricePerDay = getPricePerDay(e.reference);

                            return (
                              <div 
                                className="equipment-card"
                                key={e.id}
                                onClick={() => {
                                  if (!isOutOfStock && !isSelected) {
                                    handleAddItem(e.id);
                                  }
                                }}
                                style={{ 
                                  display: 'flex', 
                                  flexDirection: 'column', 
                                  border: `2px solid ${isSelected ? '#F97316' : '#E5E7EB'}`, 
                                  borderRadius: '12px',
                                  backgroundColor: isOutOfStock ? '#F9FAFB' : (isSelected ? '#FFF7ED' : 'white'),
                                  cursor: isOutOfStock ? 'not-allowed' : (isSelected ? 'default' : 'pointer'),
                                  opacity: isOutOfStock ? 0.6 : 1,
                                  overflow: 'hidden'
                                }}
                              >
                                <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #E5E7EB' }}>
                                  <img 
                                    src={`/images/products/${e.reference}.png?v=2`} 
                                    alt={e.name}
                                    onError={(evt) => {
                                      evt.target.style.display = 'none';
                                    }}
                                    style={{ 
                                      width: '100%', 
                                      height: '100%', 
                                      objectFit: 'contain',
                                      padding: '0'
                                    }} 
                                  />
                                  <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                                    {isOutOfStock ? (
                                      <span style={{ fontSize: '11px', color: '#EF4444', backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Rupture</span>
                                    ) : (
                                      <span style={{ fontSize: '11px', color: '#10B981', backgroundColor: '#D1FAE5', padding: '4px 8px', borderRadius: '6px', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{qtyAvailable} dispo</span>
                                    )}
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', padding: '12px', flex: 1 }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', marginBottom: '12px', flex: 1 }}>
                                    <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold', color: isOutOfStock ? '#9CA3AF' : '#111827', lineHeight: '1.3' }}>
                                      {e.name}
                                    </h4>
                                    <span style={{ fontSize: '16px', color: '#F97316', fontWeight: '900' }}>
                                      {getItemPrice(e.reference, getBookingDuration(), rentalType)} €
                                    </span>
                                    <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>
                                      pour {(rentalType === 'demi_matin' || rentalType === 'demi_aprem') ? '½ journée' : `${getBookingDuration()} jour(s)`}
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 'auto' }}>
                                    {isSelected ? (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', backgroundColor: 'white', padding: '6px 8px', borderRadius: '8px', border: '2px solid #F97316' }} onClick={ev => ev.stopPropagation()}>
                                        <button 
                                          type="button"
                                          style={{ padding: '0 8px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px', color: '#F97316', fontWeight: 'bold' }}
                                          onClick={(ev) => { ev.stopPropagation(); handleRemoveItem(e.id); }}
                                        >-</button>
                                        <span style={{ fontWeight: 'bold', color: '#F97316', textAlign: 'center', fontSize: '16px' }}>{qtySelected}</span>
                                        <button 
                                          type="button"
                                          style={{ padding: '0 8px', border: 'none', background: 'transparent', cursor: qtyAvailable > 0 ? 'pointer' : 'not-allowed', fontSize: '18px', color: qtyAvailable > 0 ? '#F97316' : '#FCA5A5', fontWeight: 'bold' }}
                                          disabled={qtyAvailable === 0}
                                          onClick={(ev) => { ev.stopPropagation(); handleAddItem(e.id); }}
                                        >+</button>
                                      </div>
                                    ) : (
                                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid #D1D5DB', transition: 'all 0.15s' }} />
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>);
                  })}
                </div>

                <button 
                  onClick={handleNextStep2} 
                  disabled={selectedEquipmentIds.length === 0}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', fontSize: '16px', backgroundColor: selectedEquipmentIds.length === 0 ? '#9CA3AF' : 'var(--primary-color)', cursor: selectedEquipmentIds.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  Continuer vers le paiement →
                </button>
              </div>)}

            {/* STEP 3: CUSTOMER COORD & STRIPE PAYMENT */}
            {step === 3 && (
              <form onSubmit={handleBook}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Vos coordonnées & Règlement</h2>
                  <button type="button" onClick={() => setStep(2)} style={{ color: '#F97316', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Retour matériel</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Prénom</label>
                      <input 
                        type="text" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)} 
                        placeholder="Jean" 
                        style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required 
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Nom</label>
                      <input 
                        type="text" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)} 
                        placeholder="Dupont" 
                        style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Adresse Email</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="jean.dupont@example.com" 
                      style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                      required 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Numéro de téléphone</label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="+33 6 12 34 56 78" 
                      style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                    />
                  </div>
                </div>

                {/* Promo Code Element */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', backgroundColor: 'white', marginBottom: '24px' }}>
                  <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '12px' }}>Code Promo (Optionnel)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      value={promoInput} 
                      onChange={(e) => setPromoInput(e.target.value.toUpperCase())} 
                      placeholder="Ex: WELCOME10" 
                      style={{ flex: 1, padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                      disabled={appliedPromo !== null}
                    />
                    {appliedPromo ? (
                      <button type="button" onClick={() => setAppliedPromo(null)} style={{ padding: '0 16px', backgroundColor: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Retirer
                      </button>) : (
                      <button type="button" onClick={handleApplyPromo} disabled={validatingPromo || !promoInput.trim()} style={{ padding: '0 16px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: (!promoInput.trim() || validatingPromo) ? 'not-allowed' : 'pointer' }}>
                        {validatingPromo ? '...' : 'Appliquer'}
                      </button>)}
                  </div>
                  {promoError && <p style={{ color: '#DC2626', fontSize: '13px', marginTop: '8px', fontWeight: 500 }}>{promoError}</p>}
                  {appliedPromo && <p style={{ color: '#059669', fontSize: '13px', marginTop: '8px', fontWeight: 500 }}>Code {appliedPromo.code} appliqué avec succès !</p>}
                </div>

                {/* Stripe Checkout Mock Element */}
                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', backgroundColor: '#F9FAFB', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                       Paiement sécurisé par <strong>stripe</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '20px' }}></span>
                      <span style={{ fontSize: '20px' }}></span>
                    </div>
                  </div>

                  {!isStripeConfigured && (
                    <div style={{ fontSize: '12px', color: '#B45309', backgroundColor: '#FEF3C7', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #FCD34D', fontWeight: 500 }}>
                      ️ <strong>Mode Démo :</strong> Entrez n'importe quelle carte bancaire (ex: 4242 4242...) pour valider.
                    </div>)}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Numéro de carte</label>
                      <input 
                        type="text" 
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        maxLength="19"
                        style={{ padding: '11px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>Date d'expiration</label>
                        <input 
                          type="text" 
                          value={expiry}
                          onChange={handleExpiryChange}
                          placeholder="MM / YY"
                          maxLength="7"
                          style={{ padding: '11px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white', textAlign: 'center' }}
                          required
                        />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>CVC (Code sécu.)</label>
                        <input 
                          type="password" 
                          value={cvc}
                          onChange={handleCvcChange}
                          placeholder="123"
                          maxLength="4"
                          style={{ padding: '11px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white', textAlign: 'center' }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                >
                  {loading ? 'Transaction en cours...' : `Payer & Valider (${getBookingTotal()} €) `}
                </button>
              </form>)}

            {/* STEP 4: CONFIRMATION */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '24px', animation: 'bounce 1s infinite' }}></span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>Félicitations !</h2>
                <p style={{ fontSize: '16px', color: '#4B5563', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                  Votre paiement a bien été validé et votre réservation de matériel est enregistrée.
                </p>

                <div className="card" style={{ padding: '24px', maxWidth: '500px', margin: '0 auto 32px auto', textAlign: 'left', backgroundColor: '#F9FAFB' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '12px' }}>Détails de la réservation</h3>
                  <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div> <strong>Dates :</strong> {(rentalType === 'demi_matin' || rentalType === 'demi_aprem') ? `Le ${new Date(startDate).toLocaleDateString('fr-FR')} (${rentalType === 'demi_matin' ? 'Matin' : 'Après-midi'})` : `Du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')} (${getBookingDuration()} jours)`}</div>
                    <div> <strong>Montant payé :</strong> {getBookingTotal()} € (par carte bancaire)</div>
                    <div> <strong>Client :</strong> {firstName} {lastName} ({email})</div>
                    <div> <strong>Matériel réservé :</strong>
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none' }}>
                        {Object.entries(
                          selectedEquipmentIds.reduce((acc, id) => {
                            acc[id] = (acc[id] || 0) + 1;
                            return acc;
                          }, {})).map(([id, qty]) => {
                          const eq = equipmentList.find(e => e.id === id);
                          if (!eq) return null;
                          return (
                            <li key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E7EB', fontSize: '14px', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>x{qty}</span>
                                <span style={{ color: '#111827', fontWeight: 500 }}>{eq.name}</span>
                              </div>
                              <span style={{ color: '#4B5563' }}>{getItemPrice(eq.reference, getBookingDuration(), rentalType) * qty} €</span>
                            </li>);
                        })}
                      </ul>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <button 
                    onClick={() => {
                      setStep(1);
                      setStartDate('');
                      setEndDate('');
                      setHalfDayDate('');
                      setSelectedEquipmentIds([]);
                      setFirstName('');
                      setLastName('');
                      setEmail('');
                      setPhone('');
                      setCardNumber('');
                      setExpiry('');
                      setCvc('');
                      setPromoInput('');
                      setAppliedPromo(null);
                    }}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                  >
                    Nouvelle réservation
                  </button>
                </div>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                  }
                `}} />
              </div>)}

          </div>

          {/* Sidebar / Reservation Summary */}
          {step < 4 && (
            <div className="card" style={{ position: 'sticky', top: '100px', height: 'fit-content' }}>
              <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Votre Réservation</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Dates de location</span>
                  {(rentalType === 'demi_matin' || rentalType === 'demi_aprem') ? (
                    halfDayDate ? (
                      <strong style={{ color: '#F3F4F6' }}>
                        Le {new Date(halfDayDate).toLocaleDateString('fr-FR')} ({halfDaySlot === 'demi_matin' ? 'Matin' : 'Aprem'})
                      </strong>) : (
                      <em style={{ color: '#9CA3AF' }}>Non définies</em>)) : (
                    startDate && endDate ? (
                      <strong style={{ color: '#F3F4F6' }}>Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')} ({getBookingDuration()} jours)</strong>) : (
                      <em style={{ color: '#9CA3AF' }}>Non définies</em>))}
                </div>

                {/* Type de location masqué car uniquement Ponctuel */}

                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Matériel choisi ({selectedEquipmentIds.length})</span>
                  {selectedEquipmentIds.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#F3F4F6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {Object.entries(
                        selectedEquipmentIds.reduce((acc, id) => {
                          acc[id] = (acc[id] || 0) + 1;
                          return acc;
                        }, {})).map(([id, qty]) => {
                        const item = equipmentList.find(e => e.id === id);
                        return <li key={id}>{item ? <><span style={{ color: '#F97316', fontWeight: 'bold', marginRight: '6px' }}>{qty}x</span>{item.name}</> : 'Équipement'}</li>;
                      })}
                    </ul>) : (
                    <em style={{ color: '#9CA3AF' }}>Aucun matériel choisi</em>)}
                </div>

                {selectedEquipmentIds.length > 0 && startDate && endDate && (
                  <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '16px' }}>
                    <span style={{ color: '#6B7280', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Montant total</span>
                    <strong style={{ color: '#F97316', fontSize: '20px' }}>{getBookingTotal()} €</strong>
                    <span style={{ color: '#6B7280', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                      Taxes incluses {(rentalType === 'demi_matin' || rentalType === 'demi_aprem') && '(60% du tarif jour)'}
                    </span>
                  </div>)}

                {(firstName || lastName || email) && (
                  <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
                    <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Vos coordonnées</span>
                    <strong style={{ color: '#F3F4F6', display: 'block' }}>{firstName} {lastName}</strong>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{email}</span>
                  </div>)}
              </div>
            </div>)}

        </div>

      </main>
    </div>);
}
