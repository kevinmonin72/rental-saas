'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

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
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Customer Info State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Fetch all inventory and active bookings to calculate real-time availability
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

        setEquipmentList(eqRes.data || []);
        setBookings(bookRes.data || []);
        setBookingItems(itemsRes.data || []);
      } catch (err) {
        console.error(err);
        setError('Impossible de charger les données du catalogue. Veuillez réessayer.');
      } finally {
        setFetchingData(false);
      }
    }
    loadData();
  }, []);

  // Helper: check quantity of equipment available for selected dates
  const getAvailableQuantity = (eqId) => {
    if (!startDate || !endDate) return 0;
    const sNew = new Date(startDate);
    sNew.setHours(0,0,0,0);
    const eNew = new Date(endDate);
    eNew.setHours(23,59,59,999);
    
    if (eNew < sNew) return 0;

    const overlappingBookingsCount = bookings.filter(b => {
      // Find if this booking contains the equipment
      const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
      if (!bItems.some(bi => bi.equipment_id === eqId)) return false;

      const sExist = new Date(b.start_date);
      sExist.setHours(0,0,0,0);
      const eExist = new Date(b.end_date);
      
      // Calculate pause duration shifts
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

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setError('Veuillez sélectionner les dates de début et de fin.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setError('La date de fin doit être postérieure à la date de début.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedEquipmentIds.length === 0) {
      setError('Veuillez sélectionner au moins un équipement pour continuer.');
      return;
    }
    setError('');
    setStep(3);
  };

  const toggleEquipmentSelection = (id) => {
    const qty = getAvailableQuantity(id);
    if (qty === 0 && !selectedEquipmentIds.includes(id)) {
      alert('Cet équipement est déjà réservé sur cette période.');
      return;
    }
    setSelectedEquipmentIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !email) {
      setError('Veuillez renseigner votre prénom, nom et email.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Double check availability right before submission
      for (const eqId of selectedEquipmentIds) {
        if (getAvailableQuantity(eqId) <= 0) {
          throw new Error("L'un des équipements sélectionnés vient d'être réservé sur cette période. Veuillez modifier votre choix.");
        }
      }

      // 2. Find or create Customer
      let customerId = null;
      const { data: existingCust, error: searchErr } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (searchErr) throw searchErr;

      if (existingCust) {
        customerId = existingCust.id;
        // Optionnel : Mettre à jour le téléphone s'il a changé
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

      // 3. Create Booking
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

      // 4. Create Booking Items
      const items = selectedEquipmentIds.map(eqId => ({
        id: uuidv4(),
        booking_id: bookingId,
        equipment_id: eqId,
        quantity: 1
      }));

      const { error: itemsErr } = await supabase.from('booking_items').insert(items);
      if (itemsErr) throw itemsErr;

      // Success
      setStep(4);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue lors de la réservation. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Get distinct categories for filtering
  const categories = Array.from(new Set(equipmentList.map(e => e.category).filter(Boolean)));

  // Filtered equipment list
  const filteredEquipment = equipmentList.filter(e => {
    const matchesSearch = `${e.name || ''} ${e.reference || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (fetchingData) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#F3F4F6', flexDirection: 'column', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontFamily: 'sans-serif', color: '#4B5563', fontWeight: 500 }}>Chargement du catalogue...</span>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F4F6', fontFamily: 'Inter, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ backgroundColor: '#1F2937', color: 'white', padding: '16px 24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🚀</span>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: 'white', letterSpacing: '-0.5px' }}>THE RIDERY WINGBOOST</h1>
          </div>
          <span style={{ fontSize: '13px', color: '#9CA3AF', backgroundColor: '#374151', padding: '6px 12px', borderRadius: '20px', fontWeight: 500 }}>
            Portail Réservation Client
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
              <span style={{ fontWeight: step === 3 ? 'bold' : 'normal', color: step === 3 ? '#111827' : '#6B7280', fontSize: '14px' }}>Coordonnées</span>
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
            
            {/* STEP 1: DATES & TYPE */}
            {step === 1 && (
              <form onSubmit={handleNextStep1}>
                <h2 style={{ fontSize: '22px', marginBottom: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>Sélectionnez vos dates de location</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
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

                <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: 'background-color 0.2s', marginTop: '16px' }}>
                  Rechercher le matériel disponible →
                </button>
              </form>
            )}

            {/* STEP 2: SELECT EQUIPMENT */}
            {step === 2 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Choisissez votre matériel</h2>
                  <button onClick={() => setStep(1)} style={{ color: '#F97316', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Modifier dates</button>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <input 
                    type="text" 
                    placeholder="🔍 Rechercher un modèle..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ flex: 1, minWidth: '200px', padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                  />
                  
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{ padding: '10px 14px', border: '1px solid #D1D5DB', borderRadius: '8px', fontSize: '14px', outline: 'none', backgroundColor: 'white' }}
                  >
                    <option value="all">Toutes catégories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Equipment Cards Grid */}
                {filteredEquipment.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>Aucun matériel ne correspond à vos critères.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {filteredEquipment.map(eq => {
                      const qtyAvailable = getAvailableQuantity(eq.id);
                      const isSelected = selectedEquipmentIds.includes(eq.id);
                      const isOutOfStock = qtyAvailable === 0;

                      return (
                        <div 
                          key={eq.id} 
                          onClick={() => !isOutOfStock && toggleEquipmentSelection(eq.id)}
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            padding: '16px', 
                            borderRadius: '12px', 
                            border: `2px solid ${isSelected ? '#F97316' : '#E5E7EB'}`, 
                            backgroundColor: isOutOfStock ? '#F9FAFB' : (isSelected ? '#FFF7ED' : 'white'),
                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                            opacity: isOutOfStock ? 0.6 : 1,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>{eq.name}</h3>
                              {eq.category && <span style={{ fontSize: '11px', backgroundColor: '#F3F4F6', color: '#4B5563', padding: '2px 6px', borderRadius: '4px' }}>{eq.category}</span>}
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>Réf: {eq.reference || 'N/A'}</p>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {isOutOfStock ? (
                              <span style={{ fontSize: '12px', color: '#EF4444', backgroundColor: '#FEE2E2', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>🚫 Indisponible</span>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#10B981', backgroundColor: '#D1FAE5', padding: '4px 8px', borderRadius: '6px', fontWeight: 600 }}>✓ Disponible ({qtyAvailable} dispo)</span>
                            )}
                            <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isSelected ? '#F97316' : '#D1D5DB'}`, backgroundColor: isSelected ? '#F97316' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                              {isSelected && '✓'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button 
                  onClick={handleNextStep2} 
                  disabled={selectedEquipmentIds.length === 0}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: selectedEquipmentIds.length === 0 ? '#9CA3AF' : '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: selectedEquipmentIds.length === 0 ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                >
                  Continuer vers vos coordonnées →
                </button>
              </div>
            )}

            {/* STEP 3: CUSTOMER COORD */}
            {step === 3 && (
              <form onSubmit={handleBook}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0 }}>Saisissez vos coordonnées</h2>
                  <button type="button" onClick={() => setStep(2)} style={{ color: '#F97316', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer' }}>← Retour matériel</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
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

                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', backgroundColor: '#F97316', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background-color 0.2s' }}
                >
                  {loading ? 'Réservation en cours...' : 'Confirmer ma réservation ✓'}
                </button>
              </form>
            )}

            {/* STEP 4: CONFIRMATION */}
            {step === 4 && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <span style={{ fontSize: '64px', display: 'block', marginBottom: '24px', animation: 'bounce 1s infinite' }}>🎉</span>
                <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', marginBottom: '16px', letterSpacing: '-0.5px' }}>Félicitations !</h2>
                <p style={{ fontSize: '16px', color: '#4B5563', maxWidth: '500px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
                  Votre réservation a bien été enregistrée. Elle est désormais disponible et visible dans notre système pour notre équipe technique.
                </p>

                <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '24px', backgroundColor: '#F9FAFB', maxWidth: '500px', margin: '0 auto 32px auto', textAlign: 'left' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '12px' }}>Détails de la réservation</h3>
                  <div style={{ fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>📅 <strong>Dates :</strong> Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}</div>
                    <div>👤 <strong>Client :</strong> {firstName} {lastName} ({email})</div>
                    <div>📦 <strong>Matériel :</strong>
                      <ul style={{ paddingLeft: '20px', marginTop: '4px' }}>
                        {selectedEquipmentIds.map(id => {
                          const item = equipmentList.find(e => e.id === id);
                          return <li key={id}>{item ? item.name : 'Équipement'}</li>;
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
                      setSelectedEquipmentIds([]);
                      setFirstName('');
                      setLastName('');
                      setEmail('');
                      setPhone('');
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
                  {startDate && endDate ? (
                    <strong style={{ color: '#F3F4F6' }}>Du {new Date(startDate).toLocaleDateString('fr-FR')} au {new Date(endDate).toLocaleDateString('fr-FR')}</strong>
                  ) : (
                    <em style={{ color: '#9CA3AF' }}>Non définies</em>
                  )}
                </div>

                {/* Type de location masqué car uniquement Ponctuel */}

                <div>
                  <span style={{ color: '#9CA3AF', display: 'block', fontSize: '12px', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Matériel sélectionné ({selectedEquipmentIds.length})</span>
                  {selectedEquipmentIds.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px', color: '#F3F4F6', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {selectedEquipmentIds.map(id => {
                        const item = equipmentList.find(e => e.id === id);
                        return <li key={id}>{item ? item.name : 'Équipement'}</li>;
                      })}
                    </ul>
                  ) : (
                    <em style={{ color: '#9CA3AF' }}>Aucun matériel choisi</em>
                  )}
                </div>

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
