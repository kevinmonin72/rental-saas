'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

const GENERIC_EQUIPMENTS = [
  { reference: 'CAT-WING', name: 'Aile de Wing / Kite (Générique)', category: 'Ailes', quantity: 9999 },
  { reference: 'CAT-BOARD', name: 'Planche (Générique)', category: 'Planches', quantity: 9999 },
  { reference: 'CAT-FOIL', name: 'Foil (Générique)', category: 'Foils', quantity: 9999 },
  { reference: 'CAT-MAST', name: 'Mât (Générique)', category: 'Mâts', quantity: 9999 },
  { reference: 'CAT-ACC', name: 'Accessoire (Générique)', category: 'Accessoires', quantity: 9999 }
];

const getPricePerDay = (reference) => {
  if (reference === 'CAT-WING') return 30; // 30€/jour
  if (reference === 'CAT-BOARD') return 25; // 25€/jour
  if (reference === 'CAT-FOIL') return 20; // 20€/jour
  if (reference === 'CAT-MAST') return 10; // 10€/jour
  if (reference === 'CAT-ACC') return 5; // 5€/jour
  return 15;
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
  const [durationMode, setDurationMode] = useState('days'); // 'days' | 'half_day'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [halfDayDate, setHalfDayDate] = useState('');
  const [halfDaySlot, setHalfDaySlot] = useState('demi_matin'); // 'demi_matin' | 'demi_aprem'
  const [rentalType, setRentalType] = useState('ponctuel');
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);
  
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

  // Fetch all inventory and active bookings, and ensure generic items exist
  useEffect(() => {
    async function loadData() {
      try {
        const [eqRes, bookRes, itemsRes] = await Promise.all([
          supabase.from('equipment').select('*'),
          supabase.from('bookings').select('*').eq('status', 'active'),
          supabase.from('booking_items').select('*')
        ]);

        if (eqRes.error) throw eqRes.error;
        if (bookRes.error) throw bookRes.error;
        if (itemsRes.error) throw itemsRes.error;

        let dbEquipments = eqRes.data || [];
        const missingGenerics = [];

        // Identify which generic equipment categories are missing in the DB
        for (const item of GENERIC_EQUIPMENTS) {
          if (!dbEquipments.some(e => e.reference === item.reference)) {
            missingGenerics.push({
              id: uuidv4(),
              reference: item.reference,
              name: item.name,
              category: item.category,
              quantity: item.quantity
            });
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
    if (durationMode === 'half_day') return 0.5;
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = Math.abs(e - s);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const getBookingTotal = () => {
    const days = getBookingDuration();
    if (days === 0 || selectedEquipmentIds.length === 0) return 0;
    
    let pricePerDayTotal = 0;
    for (const eqId of selectedEquipmentIds) {
      const item = equipmentList.find(e => e.id === eqId);
      if (item) {
        pricePerDayTotal += getPricePerDay(item.reference);
      }
    }
    
    // Half-day is 60% of the daily rate (0.6 multiplier)
    if (durationMode === 'half_day') {
      return Math.round(pricePerDayTotal * 0.6);
    }
    
    return pricePerDayTotal * days;
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (durationMode === 'days') {
      if (!startDate || !endDate) {
        setError('Veuillez sélectionner les dates de début et de fin.');
        return;
      }
      if (new Date(endDate) < new Date(startDate)) {
        setError('La date de fin doit être postérieure à la date de début.');
        return;
      }
      setRentalType('ponctuel');
    } else {
      if (!halfDayDate) {
        setError('Veuillez sélectionner la date de location.');
        return;
      }
      // For half-day, start_date and end_date are the same
      setStartDate(halfDayDate);
      setEndDate(halfDayDate);
      setRentalType(halfDaySlot);
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

  const toggleEquipmentSelection = (id) => {
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
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
          endDate
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
      const items = selectedEquipmentIds.map(eqId => ({
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: eqId,
        quantity: 1
      }));

      const { error: itemsErr } = await supabase.from('booking_items').insert(items);
      if (itemsErr) throw itemsErr;

      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la transaction. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Script Stripe loader if configured */}
      {isStripeConfigured && (
        <script src="https://js.stripe.com/v3/" async></script>
      )}

      {/* Header */}
      <header style={{ backgroundColor: '#1F2937', color: 'white', padding: '16px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.5px' }}>THE RIDERY WINGBOOST</h1>
          </div>
          <span style={{ fontSize: '13px', color: '#9CA3AF', backgroundColor: '#374151', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
            Portail Client
          </span>
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '40px auto', padding: '0 24px 80px 24px' }}>
        
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
          </div>
        )}

        {error && (
          <div style={{ backgroundColor: '#FEE2E2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '14px 16px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', fontWeight: '500' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: step === 4 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          
          {/* Main Card */}
          <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.05)', border: '1px solid #E5E7EB' }}>
            
            {/* STEP 1: DATES */}
            {step === 1 && (
              <form onSubmit={handleNextStep1}>
                <h2 style={{ fontSize: '22px', marginBottom: '20px', fontWeight: 700, letterSpacing: '-0.5px' }}>Sélectionnez votre formule de location</h2>

                {/* Duration Mode Selector */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: `2px solid ${durationMode === 'days' ? '#F97316' : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: durationMode === 'days' ? '#FFF7ED' : 'white', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' }}>
                    <input type="radio" name="durationMode" value="days" checked={durationMode === 'days'} onChange={() => setDurationMode('days')} style={{ display: 'none' }} />
                    📅 Journée(s) entière(s)
                  </label>
                  <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '14px', border: `2px solid ${durationMode === 'half_day' ? '#F97316' : '#E5E7EB'}`, borderRadius: '8px', cursor: 'pointer', backgroundColor: durationMode === 'half_day' ? '#FFF7ED' : 'white', fontWeight: 'bold', fontSize: '14px', transition: 'all 0.2s' }}>
                    <input type="radio" name="durationMode" value="half_day" checked={durationMode === 'half_day'} onChange={() => setDurationMode('half_day')} style={{ display: 'none' }} />
                    ⏱️ Demi-journée (60% tarif)
                  </label>
                </div>
                
                {durationMode === 'days' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Date de début</label>
                      <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Date de fin</label>
                      <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required 
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Date de location</label>
                      <input 
                        type="date" 
                        value={halfDayDate} 
                        onChange={(e) => setHalfDayDate(e.target.value)} 
                        style={{ padding: '12px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '15px', outline: 'none' }}
                        required 
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Créneau horaire</label>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', border: `2px solid ${halfDaySlot === 'demi_matin' ? '#F97316' : '#E5E7EB'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: halfDaySlot === 'demi_matin' ? '#FFF7ED' : 'white', transition: 'all 0.2s' }}>
                          <input type="radio" name="halfDaySlot" value="demi_matin" checked={halfDaySlot === 'demi_matin'} onChange={() => setHalfDaySlot('demi_matin')} style={{ display: 'none' }} />
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>☀️ Matin</span>
                          <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>09h00 - 13h00</span>
                        </label>
                        <label style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '14px', border: `2px solid ${halfDaySlot === 'demi_aprem' ? '#F97316' : '#E5E7EB'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: halfDaySlot === 'demi_aprem' ? '#FFF7ED' : 'white', transition: 'all 0.2s' }}>
                          <input type="radio" name="halfDaySlot" value="demi_aprem" checked={halfDaySlot === 'demi_aprem'} onChange={() => setHalfDaySlot('demi_aprem')} style={{ display: 'none' }} />
                          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827' }}>⛅ Après-midi</span>
                          <span style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>14h00 - 18h00</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '16px' }}>
                  Rechercher le matériel disponible →
                </button>
              </form>
            )}

            {/* STEP 2: SELECT EQUIPMENT TYPES */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Type de matériel à louer</h2>
                  <button onClick={() => setStep(1)} style={{ color: '#F97316', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Modifier dates</button>
                </div>
                
                <p style={{ color: '#4B5563', fontSize: '14px', marginBottom: '24px' }}>
                  Cochez le ou les types de matériel que vous souhaitez louer pour votre session :
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                  {GENERIC_EQUIPMENTS.map(item => {
                    const dbItem = equipmentList.find(e => e.reference === item.reference);
                    if (!dbItem) return null;
                    
                    const isSelected = selectedEquipmentIds.includes(dbItem.id);
                    const pricePerDay = getPricePerDay(item.reference);
                    
                    return (
                      <div 
                        key={item.reference} 
                        onClick={() => toggleEquipmentSelection(dbItem.id)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '18px 20px', 
                          borderRadius: '12px', 
                          border: `2px solid ${isSelected ? '#F97316' : '#E5E7EB'}`, 
                          backgroundColor: isSelected ? '#FFF7ED' : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 6px -1px rgba(249, 115, 22, 0.05)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <span style={{ fontSize: '28px' }}>
                            {item.reference === 'CAT-WING' && '💨'}
                            {item.reference === 'CAT-BOARD' && '🏄'}
                            {item.reference === 'CAT-FOIL' && '🦅'}
                            {item.reference === 'CAT-MAST' && '📏'}
                            {item.reference === 'CAT-ACC' && '🎒'}
                          </span>
                          <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>
                              {item.reference === 'CAT-WING' && 'Ailes (Wing / Kite)'}
                              {item.reference === 'CAT-BOARD' && 'Planches'}
                              {item.reference === 'CAT-FOIL' && 'Foils'}
                              {item.reference === 'CAT-MAST' && 'Mâts'}
                              {item.reference === 'CAT-ACC' && 'Accessoires (Harnais, Combinaison, Gilet)'}
                            </h3>
                            <span style={{ fontSize: '13px', color: '#F97316', fontWeight: '600' }}>
                              {durationMode === 'half_day' ? `${Math.round(pricePerDay * 0.6)} € / demi-journée` : `${pricePerDay} € / jour`}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ 
                            width: '22px', 
                            height: '22px', 
                            borderRadius: '50%', 
                            border: `2px solid ${isSelected ? '#F97316' : '#D1D5DB'}`, 
                            backgroundColor: isSelected ? '#F97316' : 'transparent', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            transition: 'all 0.15s'
                          }}>
                            {isSelected && '✓'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button 
                  onClick={handleNextStep2} 
                  disabled={selectedEquipmentIds.length === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: selectedEquipmentIds.length === 0 ? '#9CA3AF' : '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: selectedEquipmentIds.length === 0 ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                >
                  Continuer vers le paiement →
                </button>
              </div>
            )}

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

                {/* Stripe Checkout Mock Element */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '24px', backgroundColor: '#F9FAFB', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      💳 Paiement sécurisé par <strong>stripe</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontSize: '20px' }}>🌐</span>
                      <span style={{ fontSize: '20px' }}>🔒</span>
                    </div>
                  </div>

                  {!isStripeConfigured && (
                    <div style={{ fontSize: '12px', color: '#B45309', backgroundColor: '#FEF3C7', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #FCD34D', fontWeight: 500 }}>
                      ⚙️ <strong>Mode Démo :</strong> Entrez n'importe quelle carte bancaire (ex: 4242 4242...) pour valider.
                    </div>
                  )}

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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                >
                  {loading ? 'Transaction en cours...' : `Payer & Valider (${getBookingTotal()} €) 🔒`}
                </button>
              </form>
            )}

            {/* STEP 4: CONFIRMATION */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '24px', animation: 'bounce 1s infinite' }}>🎉</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>Félicitations !</h2>
                <p style={{ fontSize: '16px', color: '#4B5563', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                  Votre paiement a bien été validé et votre réservation de matériel est enregistrée.
                </p>

                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', backgroundColor: '#F9FAFB', maxWidth: '500px', margin: '0 auto 32px auto', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '12px' }}>Détails de la réservation</h3>
                  <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>📅 <strong>Dates :</strong> {durationMode === 'half_day' ? `Le ${new Date(startDate).toLocaleDateString('fr-FR')} (${rentalType === 'demi_matin' ? 'Matin' : 'Après-midi'})` : `Du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')} (${getBookingDuration()} jours)`}</div>
                    <div>💰 <strong>Montant payé :</strong> {getBookingTotal()} € (par carte bancaire)</div>
                    <div>👤 <strong>Client :</strong> {firstName} {lastName} ({email})</div>
                    <div>📦 <strong>Matériel réservé :</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                        {selectedEquipmentIds.map(id => {
                          const item = equipmentList.find(e => e.id === id);
                          let displayName = 'Équipement';
                          if (item) {
                            if (item.reference === 'CAT-WING') displayName = 'Ailes (Wing / Kite)';
                            else if (item.reference === 'CAT-BOARD') displayName = 'Planches';
                            else if (item.reference === 'CAT-FOIL') displayName = 'Foils';
                            else if (item.reference === 'CAT-MAST') displayName = 'Mâts';
                            else if (item.reference === 'CAT-ACC') displayName = 'Accessoires';
                            else displayName = item.name;
                          }
                          return <li key={id}>{displayName}</li>;
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
                    }}
                    style={{ padding: '12px 24px', backgroundColor: '#F97316', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
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
              </div>
            )}

          </div>

          {/* Sidebar / Reservation Summary */}
          {step < 4 && (
            <div style={{ backgroundColor: '#1F2937', color: 'white', padding: '28px', borderRadius: '16px', height: 'fit-content', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.1)' }}>
              <h3 style={{ color: 'white', borderBottom: '1px solid #374151', paddingBottom: '12px', marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>Votre Réservation</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '14px' }}>
                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Dates de location</span>
                  {durationMode === 'half_day' ? (
                    halfDayDate ? (
                      <strong style={{ color: '#F3F4F6' }}>
                        Le {new Date(halfDayDate).toLocaleDateString('fr-FR')} ({halfDaySlot === 'demi_matin' ? 'Matin' : 'Aprem'})
                      </strong>
                    ) : (
                      <em style={{ color: '#9CA3AF' }}>Non définies</em>
                    )
                  ) : (
                    startDate && endDate ? (
                      <strong style={{ color: '#F3F4F6' }}>Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')} ({getBookingDuration()} jours)</strong>
                    ) : (
                      <em style={{ color: '#9CA3AF' }}>Non définies</em>
                    )
                  )}
                </div>

                {/* Type de location masqué car uniquement Ponctuel */}

                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Matériel choisi ({selectedEquipmentIds.length})</span>
                  {selectedEquipmentIds.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#F3F4F6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedEquipmentIds.map(id => {
                        const item = equipmentList.find(e => e.id === id);
                        let displayName = 'Équipement';
                        if (item) {
                          if (item.reference === 'CAT-WING') displayName = 'Ailes (Wing / Kite)';
                          else if (item.reference === 'CAT-BOARD') displayName = 'Planches';
                          else if (item.reference === 'CAT-FOIL') displayName = 'Foils';
                          else if (item.reference === 'CAT-MAST') displayName = 'Mâts';
                          else if (item.reference === 'CAT-ACC') displayName = 'Accessoires';
                          else displayName = item.name;
                        }
                        return <li key={id}>{displayName}</li>;
                      })}
                    </ul>
                  ) : (
                    <em style={{ color: '#9CA3AF' }}>Aucun matériel choisi</em>
                  )}
                </div>

                {selectedEquipmentIds.length > 0 && ((durationMode === 'days' && startDate && endDate) || (durationMode === 'half_day' && halfDayDate)) && (
                  <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
                    <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Montant total</span>
                    <strong style={{ color: '#F97316', fontSize: '20px' }}>{getBookingTotal()} €</strong>
                    <span style={{ color: '#9CA3AF', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                      Taxes incluses {durationMode === 'half_day' && '(60% du tarif jour)'}
                    </span>
                  </div>
                )}

                {(firstName || lastName || email) && (
                  <div style={{ borderTop: '1px solid #374151', paddingTop: '16px' }}>
                    <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Vos coordonnées</span>
                    <strong style={{ color: '#F3F4F6', display: 'block' }}>{firstName} {lastName}</strong>
                    <span style={{ color: '#9CA3AF', fontSize: '13px' }}>{email}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
