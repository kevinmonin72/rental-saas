'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function BookingsPage() {
  const formatName = (f, l) => {
    const sf = (f === 'undefined' || f === 'null' || !f) ? '' : f;
    const sl = (l === 'undefined' || l === 'null' || !l) ? '' : l;
    return `${sf} ${sl}`.trim();
  };

  const [mounted, setMounted] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [selectedEquipments, setSelectedEquipments] = useState([]);
  const [currentEqSelection, setCurrentEqSelection] = useState('');
  const [rentalType, setRentalType] = useState('ponctuel');
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pauseStart, setPauseStart] = useState('');
  const [pauseEnd, setPauseEnd] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [rentalTypeFilter, setRentalTypeFilter] = useState('all');
  const [highlightedBookingId, setHighlightedBookingId] = useState(null);
  const [startMonthFilter, setStartMonthFilter] = useState(null);
  const [endMonthFilter, setEndMonthFilter] = useState(null);

  const { 
    customers, 
    equipment, 
    bookings,
    bookingItems,
    addBooking, 
    updateBooking,
    deleteBooking,
    bulkDeleteBookings,
    markBookingCompleted, 
    getDetailedActiveBookings,
    getDetailedPastBookings,
    toggleShopifyTransfer
  } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  let filteredCustomersForSelect = customers.filter(c => {
    const term = customerSearch.toLowerCase();
    const fullName = formatName(c.first_name, c.last_name).toLowerCase();
    return fullName.includes(term) || (c.email && c.email.toLowerCase().includes(term)) || (c.phone && c.phone.includes(term));
  }).slice(0, 100); // Limit to 100 to prevent DOM lag

  // Ensure selected customer is always in the list even if filtered out or truncated
  if (selectedCustomerId && !filteredCustomersForSelect.some(c => c.id === selectedCustomerId)) {
    const sc = customers.find(c => c.id === selectedCustomerId);
    if (sc) {
      filteredCustomersForSelect = [sc, ...filteredCustomersForSelect];
    }
  }

  const filteredEquipmentForSelect = equipment.filter(e => {
    const term = equipmentSearch.toLowerCase();
    const eqName = `${e.reference || ''} ${e.name}`.toLowerCase();
    return eqName.includes(term);
  }).slice(0, 100); // Limit to 100 to prevent DOM lag

  const handleAdd = (e) => {
    e.preventDefault();
    if (selectedEquipments.length === 0) {
      alert("Veuillez sélectionner au moins un équipement.");
      return;
    }

    const sNew = new Date(startDate);
    sNew.setHours(0,0,0,0);
    const eNew = new Date(endDate);
    eNew.setHours(23,59,59,999);

    // Check for overlap for all selected equipments
    const overlappingEq = selectedEquipments.find(eq => {
      const overlappingBookingsCount = bookings.filter(b => {
        if (b.status !== 'active') return false;
        if (editingBookingId && b.id === editingBookingId) return false; // Ignore current booking if editing
        const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
        if (!bItems.some(bi => bi.equipment_id === eq.id)) return false;
        
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
        
        let localENew = new Date(eNew);
        if (rentalType === 'wingboost' && pauseStart && pauseEnd) {
          const nps = new Date(pauseStart);
          const npe = new Date(pauseEnd);
          if (npe >= nps) {
            const diffDays = Math.ceil(Math.abs(npe - nps) / (1000 * 60 * 60 * 24));
            localENew.setDate(localENew.getDate() + diffDays);
          }
        }
        
        return (sNew <= eExist && sExist <= localENew);
      }).length;

      const totalQty = parseInt(eq.quantity, 10) || 1;
      return overlappingBookingsCount >= totalQty;
    });

    if (overlappingEq) {
      alert(`Impossible : L'article (Réf: ${overlappingEq.reference || 'N/A'} - ${overlappingEq.name}) est déjà réservé sur cette période !`);
      return;
    }

    if (editingBookingId) {
      updateBooking(editingBookingId, {
        customerId: selectedCustomerId,
        startDate: startDate,
        endDate: endDate,
        equipments: selectedEquipments.map(e => ({ id: e.id, customStart: e.customStart || null, customEnd: e.customEnd || null, is_returned: e.is_returned || false })),
        rentalType: rentalType,
        pauseStart: rentalType === 'wingboost' ? pauseStart : null,
        pauseEnd: rentalType === 'wingboost' ? pauseEnd : null
      });
      setEditingBookingId(null);
    } else {
      addBooking({
        customerId: selectedCustomerId,
        startDate: startDate,
        endDate: endDate,
        equipments: selectedEquipments.map(e => ({ id: e.id, customStart: e.customStart || null, customEnd: e.customEnd || null, is_returned: e.is_returned || false })),
        rentalType: rentalType,
        pauseStart: rentalType === 'wingboost' ? pauseStart : null,
        pauseEnd: rentalType === 'wingboost' ? pauseEnd : null
      });
    }
    
    setSelectedEquipments([]);
    setStartDate('');
    setEndDate('');
    setPauseStart('');
    setPauseEnd('');
    setSelectedCustomerId('');
    setHighlightedBookingId(null);
    setSearchQuery('');
    setStartMonthFilter(null);
    setEndMonthFilter(null);
    setRentalTypeFilter('all');
  };

  const handleEdit = (booking) => {
    setEditingBookingId(booking.id);
    setSelectedCustomerId(booking.customer_id);
    setStartDate(booking.start_date);
    setEndDate(booking.end_date);
    setPauseStart(booking.pause_start || '');
    setPauseEnd(booking.pause_end || '');
    setRentalType(booking.rental_type || 'ponctuel');
    setSelectedEquipments(booking.equipments);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setSelectedEquipments([]);
    setStartDate('');
    setEndDate('');
    setPauseStart('');
    setPauseEnd('');
    setSelectedCustomerId('');
    setHighlightedBookingId(null);
    setSearchQuery('');
    setStartMonthFilter(null);
    setEndMonthFilter(null);
  };

  const handleSelectAll = (e, list) => {
    if (e.target.checked) {
      setSelectedIds(list.map(b => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer définitivement ${selectedIds.length} réservation(s) sélectionnée(s) ?`)) {
      bulkDeleteBookings(selectedIds);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    if (mounted && bookings.length > 0) {
      const params = new URLSearchParams(window.location.search);
      let needsUrlClean = false;

      const bookingId = params.get('bookingId');
      if (bookingId) {
        const detailedActive = getDetailedActiveBookings();
        const detailedPast = getDetailedPastBookings();
        const b = detailedActive.find(x => x.id === bookingId) || detailedPast.find(x => x.id === bookingId);
        
        if (b) {
          if (b.status === 'active') {
            handleEdit(b);
          }
          setHighlightedBookingId(bookingId);
          
          const fullName = formatName(b.first_name, b.last_name);
          setSearchQuery(fullName);
          needsUrlClean = true;
        }
      }

      const startMonth = params.get('startMonth');
      if (startMonth) {
        setStartMonthFilter(startMonth);
        const rentalType = params.get('rentalType');
        if (rentalType) {
          setRentalTypeFilter(rentalType);
        }
        needsUrlClean = true;
      }

      const endMonth = params.get('endMonth');
      if (endMonth) {
        setEndMonthFilter(endMonth);
        needsUrlClean = true;
      }

      if (needsUrlClean) {
        // Nettoie l'URL sans recharger la page
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [mounted, bookings]);

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const rawActiveBookings = getDetailedActiveBookings();
  const rawPastBookings = getDetailedPastBookings();

  const filterAndSort = (list) => {
    return list.filter(b => {
      // 1. Type Filter
      if (rentalTypeFilter !== 'all' && (b.rental_type || 'ponctuel') !== rentalTypeFilter) {
        return false;
      }

      // 2. Start Month Filter
      if (startMonthFilter) {
        const start = new Date(b.start_date);
        const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
        if (key !== startMonthFilter) {
          return false;
        }
      }

      // 3. End Month Filter
      if (endMonthFilter) {
        let baseEndDate = new Date(b.end_date);
        if (b.pause_start && b.pause_end) {
          const ps = new Date(b.pause_start);
          const pe = new Date(b.pause_end);
          if (pe >= ps) {
            const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
            baseEndDate.setDate(baseEndDate.getDate() + diffDays);
          }
        }
        
        let matches = false;
        
        if (b.equipments && b.equipments.length > 0) {
          b.equipments.forEach(eq => {
            const itemEnd = eq.customEnd ? new Date(eq.customEnd) : baseEndDate;
            const key = `${itemEnd.getFullYear()}-${String(itemEnd.getMonth() + 1).padStart(2, '0')}`;
            if (key === endMonthFilter) matches = true;
          });
        } else {
          const key = `${baseEndDate.getFullYear()}-${String(baseEndDate.getMonth() + 1).padStart(2, '0')}`;
          if (key === endMonthFilter) matches = true;
        }

        if (!matches) {
          return false;
        }
      }
      
      // 4. Text Search
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const eqsStr = b.equipments?.map(eq => `${eq.name || ''} ${eq.reference || ''}`).join(' ') || '';
      const searchStr = `${formatName(b.first_name, b.last_name)} ${eqsStr}`.toLowerCase();
      return searchStr.includes(term);
    }).sort((a, b) => {
      const dateA = new Date(a.end_date);
      const dateB = new Date(b.end_date);
      if (sortOrder === 'desc') return dateB - dateA;
      return dateA - dateB;
    });
  };

  const activeBookings = filterAndSort(rawActiveBookings);
  const pastBookings = filterAndSort(rawPastBookings);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Réservations</h1>
        <CsvImporterButton type="bookings" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add/Edit Form */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingBookingId ? 'Modifier la Réservation' : 'Nouvelle Réservation'}</h2>
            {editingBookingId && (
              <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" style={{ fontSize: '12px' }}>Annuler</button>
            )}
          </div>
          {customers.length === 0 || equipment.length === 0 ? (
            <p style={{ color: 'var(--text-light)', fontSize: '14px' }}>
              ⚠️ Vous devez d'abord ajouter au moins un client et un équipement pour créer une réservation.
            </p>
          ) : (
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Client</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="🔍 Filtrer par nom, prénom, email..." 
                  style={{ marginBottom: '8px' }}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
                <select name="customerId" className="input" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} required>
                  <option value="">-- Choisir un client --</option>
                  {filteredCustomersForSelect.map(c => (
                    <option key={c.id} value={c.id}>
                      {formatName(c.first_name, c.last_name)} {c.email ? `- ${c.email}` : ''} {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Type de Location</label>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                    <input type="radio" name="rentalType" value="ponctuel" checked={rentalType === 'ponctuel'} onChange={() => setRentalType('ponctuel')} />
                    🕒 Ponctuelle
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'normal', cursor: 'pointer' }}>
                    <input type="radio" name="rentalType" value="wingboost" checked={rentalType === 'wingboost'} onChange={() => setRentalType('wingboost')} />
                    🚀 Wingboost
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Équipements ({selectedEquipments.length} sélectionnés)</label>
                
                {selectedEquipments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px', padding: '12px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    {selectedEquipments.map(eq => (
                      <div key={eq.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '8px', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '500', textDecoration: eq.is_returned ? 'line-through' : 'none', color: eq.is_returned ? '#9CA3AF' : 'inherit' }}>
                            Réf: {eq.reference || 'N/A'} - {eq.name}
                            {eq.is_returned && <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '12px', fontWeight: 'bold' }}>✅ Rendu</span>}
                          </span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="button" onClick={() => {
                              setSelectedEquipments(selectedEquipments.map(e => e.id === eq.id ? { ...e, is_returned: !e.is_returned } : e));
                            }} style={{ background: eq.is_returned ? '#F3F4F6' : '#10B981', color: eq.is_returned ? '#374151' : 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>
                              {eq.is_returned ? 'Annuler retour' : '✅ Rendu'}
                            </button>
                            {rentalType === 'wingboost' && (
                              <button type="button" onClick={() => {
                                setSelectedEquipments(selectedEquipments.map(e => e.id === eq.id ? { ...e, showOptions: !e.showOptions } : e));
                              }} style={{ background: 'none', border: '1px solid #D1D5DB', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}>
                                Options ⚙️
                              </button>
                            )}
                            <button type="button" onClick={() => setSelectedEquipments(selectedEquipments.filter(e => e.id !== eq.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                          </div>
                        </div>
                        {eq.showOptions && rentalType === 'wingboost' && (
                          <div style={{ padding: '8px', backgroundColor: '#F3F4F6', borderRadius: '4px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                            <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '4px' }}>Cet équipement a-t-il une durée différente de l'abonnement principal ?</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px' }}>Date de début</label>
                                <input type="date" className="input" style={{ padding: '4px 8px', fontSize: '13px' }} value={eq.customStart || ''} onChange={(e) => setSelectedEquipments(selectedEquipments.map(item => item.id === eq.id ? { ...item, customStart: e.target.value } : item))} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '12px' }}>Date de fin</label>
                                <input type="date" className="input" style={{ padding: '4px 8px', fontSize: '13px' }} value={eq.customEnd || ''} onChange={(e) => setSelectedEquipments(selectedEquipments.map(item => item.id === eq.id ? { ...item, customEnd: e.target.value } : item))} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <input 
                  type="text" 
                  className="input" 
                  placeholder="🔍 Filtrer par nom ou réf d'équipement (ou taper une réf de réservation ex: #RW0001)" 
                  style={{ marginBottom: '8px' }}
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                />
                
                {(() => {
                  const foundBookingRef = equipmentSearch.trim().replace(/^#/, '').toUpperCase();
                  let matchingBookingForEquipments = null;
                  if (foundBookingRef.length >= 2) {
                    matchingBookingForEquipments = bookings.find(b => (b.reference || '').toUpperCase() === foundBookingRef);
                    if (!matchingBookingForEquipments) {
                      matchingBookingForEquipments = bookings.find(b => (b.reference || '').toUpperCase().includes(foundBookingRef));
                    }
                  }
                  
                  if (matchingBookingForEquipments) {
                    return (
                      <div style={{ backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE', padding: '8px 12px', borderRadius: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#1E40AF' }}>
                          Réservation <strong>#{matchingBookingForEquipments.reference}</strong> trouvée.
                        </span>
                        <button type="button" className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '12px' }} onClick={() => {
                          const bItems = bookingItems.filter(bi => bi.booking_id === matchingBookingForEquipments.id);
                          const eqsToAdd = [];
                          bItems.forEach(bi => {
                            const eq = equipment.find(e => e.id === bi.equipment_id);
                            if (eq && !selectedEquipments.some(se => se.id === eq.id)) {
                              eqsToAdd.push(eq);
                            }
                          });
                          setSelectedEquipments([...selectedEquipments, ...eqsToAdd]);
                          setEquipmentSearch('');
                        }}>
                          Ajouter tout le matériel ({bookingItems.filter(bi => bi.booking_id === matchingBookingForEquipments.id).length})
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    className="input" 
                    value={currentEqSelection} 
                    onChange={(e) => setCurrentEqSelection(e.target.value)} 
                    style={{ marginBottom: 0 }}
                  >
                    <option value="">-- Sélectionner un équipement --</option>
                    {filteredEquipmentForSelect.filter(e => !selectedEquipments.find(se => se.id === e.id)).map(e => (
                      <option key={e.id} value={e.id}>Réf: {e.reference || 'N/A'} - {e.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary" onClick={() => {
                    if (currentEqSelection) {
                      const eq = equipment.find(e => e.id === currentEqSelection);
                      if (eq) {
                        setSelectedEquipments([...selectedEquipments, eq]);
                        setCurrentEqSelection('');
                        setEquipmentSearch('');
                      }
                    }
                  }}>Ajouter</button>
                </div>
              </div>
              <div className="form-group">
                <label>Date de début</label>
                <input type="date" name="startDate" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input type="date" name="endDate" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
              </div>
              {rentalType === 'wingboost' && (
                <details style={{ marginBottom: '16px', border: '1px solid #D1D5DB', borderRadius: '6px', padding: '10px', backgroundColor: '#F9FAFB' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: '500', fontSize: '14px', color: '#4B5563', outline: 'none' }}>
                    ⏸️ Ajouter une période de pause (Optionnel)
                  </summary>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '12px' }}>Début de la pause</label>
                      <input type="date" name="pauseStart" className="input" value={pauseStart} onChange={(e) => setPauseStart(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                      <label style={{ fontSize: '12px' }}>Fin de la pause</label>
                      <input type="date" name="pauseEnd" className="input" value={pauseEnd} onChange={(e) => setPauseEnd(e.target.value)} />
                    </div>
                  </div>
                </details>
              )}
              <button type="submit" className="btn btn-primary">{editingBookingId ? 'Mettre à jour' : 'Créer'}</button>
            </form>
          )}
        </div>

        {/* List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Réservations</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="input" 
                value={rentalTypeFilter}
                onChange={(e) => setRentalTypeFilter(e.target.value)}
                style={{ width: '150px', margin: 0 }}
              >
                <option value="all">Tous types</option>
                <option value="wingboost">🚀 Wingboost</option>
                <option value="ponctuel">🕒 Ponctuelle</option>
              </select>
              <select 
                className="input" 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ width: '150px', margin: 0 }}
              >
                <option value="desc">Récentes d'abord</option>
                <option value="asc">Anciennes d'abord</option>
              </select>
              <input
                type="text"
                className="input"
                placeholder="Rechercher (client, matériel, réf)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '250px', margin: 0 }}
              />
            </div>
          </div>

          {(startMonthFilter || endMonthFilter) && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              backgroundColor: '#EFF6FF', 
              border: '1px solid #BFDBFE', 
              padding: '12px 16px', 
              borderRadius: '8px', 
              marginTop: '16px',
              fontSize: '14px',
              color: '#1E40AF'
            }}>
              <div>
                🔍 <strong>Filtre actif :</strong>{' '}
                {startMonthFilter && `Début de location en ${(() => {
                  const [y, m] = startMonthFilter.split('-');
                  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                })()}`}
                {endMonthFilter && `Retour prévu en ${(() => {
                  const [y, m] = endMonthFilter.split('-');
                  return new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
                })()}`}
              </div>
              <button 
                onClick={() => {
                  setStartMonthFilter(null);
                  setEndMonthFilter(null);
                  setRentalTypeFilter('all');
                }} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#1D4ED8', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Effacer le filtre ✕
              </button>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, color: 'var(--text-main)' }}>En cours</h3>
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn btn-secondary" style={{ color: 'white', backgroundColor: '#ef4444', border: 'none', padding: '6px 12px' }}>
                Supprimer les {selectedIds.length} sélectionnées
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px', marginBottom: '16px' }}>
            <input 
              type="checkbox" 
              onChange={(e) => handleSelectAll(e, [...activeBookings, ...pastBookings])} 
              checked={selectedIds.length > 0 && selectedIds.length === activeBookings.length + pastBookings.length}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Tout sélectionner (toutes les listes)</span>
          </div>

          {activeBookings.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucune réservation active.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeBookings.map(booking => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let baseEndDate = new Date(booking.end_date);
                if (booking.pause_start && booking.pause_end) {
                  const ps = new Date(booking.pause_start);
                  const pe = new Date(booking.pause_end);
                  if (pe >= ps) {
                    const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
                    baseEndDate.setDate(baseEndDate.getDate() + diffDays);
                  }
                }
                baseEndDate.setHours(0, 0, 0, 0);

                let isLate = baseEndDate < today;
                // If baseEndDate is past, but all items are returned, it shouldn't be late? Wait, if they are all returned, the booking should probably be marked complete. We will leave baseEndDate logic, but for equipments we check is_returned.
                if (!isLate && booking.equipments) {
                  isLate = booking.equipments.some(eq => {
                    if (eq.is_returned) return false;
                    if (eq.customEnd) {
                      const eqEndDate = new Date(eq.customEnd);
                      eqEndDate.setHours(0, 0, 0, 0);
                      return eqEndDate < today;
                    }
                    return false;
                  });
                }
                const isHighlighted = highlightedBookingId === booking.id;

                return (
                  <div key={booking.id} className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    borderLeft: `4px solid ${isHighlighted ? '#f59e0b' : (isLate ? '#ef4444' : 'var(--primary-color)')}`,
                    backgroundColor: isHighlighted ? '#FEF3C7' : (isLate ? '#FEF2F2' : 'var(--surface-color)'),
                    padding: '16px',
                    boxShadow: isHighlighted ? '0 0 0 2px #f59e0b' : 'none',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(booking.id)}
                      onChange={() => toggleSelect(booking.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, color: isLate ? '#991B1B' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'normal', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>#{booking.reference || booking.id.split('-')[0].toUpperCase()}</span>
                          {formatName(booking.first_name, booking.last_name)}
                        </h3>
                        {booking.rental_type === 'wingboost' ? (
                          <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none' }}>🚀 Wingboost</span>
                        ) : booking.rental_type === 'demi_matin' ? (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none' }}>☀️ ½j (Matin)</span>
                        ) : booking.rental_type === 'demi_aprem' ? (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none' }}>⛅ ½j (Aprem)</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', border: 'none' }}>🕒 Ponctuelle</span>
                        )}
                        {isLate && <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>En Retard</span>}
                      </div>
                      
                      <div style={{ margin: '8px 0', color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                        {(() => {
                          let baseEndDate = new Date(booking.end_date);
                          if (booking.pause_start && booking.pause_end) {
                            const ps = new Date(booking.pause_start);
                            const pe = new Date(booking.pause_end);
                            if (pe >= ps) {
                              const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
                              baseEndDate.setDate(baseEndDate.getDate() + diffDays);
                            }
                          }

                          let displayedEquipments = booking.equipments || [];
                          if (endMonthFilter) {
                            displayedEquipments = displayedEquipments.filter(eq => {
                              const itemEnd = eq.customEnd ? new Date(eq.customEnd) : baseEndDate;
                              const key = `${itemEnd.getFullYear()}-${String(itemEnd.getMonth() + 1).padStart(2, '0')}`;
                              return key === endMonthFilter;
                            });
                          }

                          return (
                            <>
                              <strong>Matériel {endMonthFilter ? 'prévu ce mois-ci' : ''} ({displayedEquipments.length}) :</strong>
                              <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '14px' }}>
                                {displayedEquipments.map(eq => {
                                  let eqLate = false;
                                  if (!eq.is_returned && eq.customEnd) {
                                    const eqEnd = new Date(eq.customEnd);
                                    eqEnd.setHours(0,0,0,0);
                                    if (eqEnd < today) eqLate = true;
                                  }
                                  return (
                                    <li key={eq.id} style={{ 
                                      color: (eq.is_returned) ? '#9CA3AF' : (eqLate ? '#ef4444' : 'inherit'),
                                      textDecoration: eq.is_returned ? 'line-through' : 'none'
                                    }}>
                                      {eq.name} (Réf: {eq.reference || 'N/A'})
                                      {eq.is_returned && <span style={{ marginLeft: '8px', color: '#10B981', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' }}>✅ Rendu</span>}
                                      {eqLate && !eq.is_returned && <span style={{ marginLeft: '8px', fontSize: '11px', color: '#ef4444' }}>(En retard)</span>}
                                      {eq.customEnd && !eq.is_returned && <span style={{ marginLeft: '4px', fontSize: '11px', color: '#6B7280' }}>(jusqu'au {new Date(eq.customEnd).toLocaleDateString('fr-FR')})</span>}
                                    </li>
                                  );
                                })}
                              </ul>
                              {endMonthFilter && displayedEquipments.length < (booking.equipments?.length || 0) && (
                                <div style={{ fontSize: '12px', color: 'var(--text-light)', marginTop: '4px', fontStyle: 'italic' }}>
                                  + {(booking.equipments?.length || 0) - displayedEquipments.length} autre(s) équipement(s) à d'autres dates
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </div>

                      <p style={{ margin: 0, color: isLate ? '#DC2626' : 'var(--text-light)', fontSize: '14px', fontWeight: isLate ? 'bold' : 'normal' }}>
                        Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                      </p>
                      {booking.pause_start && booking.pause_end && (() => {
                        const ps = new Date(booking.pause_start);
                        const pe = new Date(booking.pause_end);
                        if (pe >= ps) {
                          const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
                          const newEnd = new Date(booking.end_date);
                          newEnd.setDate(newEnd.getDate() + diffDays);
                          return (
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '14px', fontStyle: 'italic' }}>
                              Pause du {ps.toLocaleDateString('fr-FR')} au {pe.toLocaleDateString('fr-FR')} et nouvelle fin le {newEnd.toLocaleDateString('fr-FR')}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', backgroundColor: isLate ? '#FEE2E2' : '#F9F9F9', borderRadius: '8px', minWidth: '220px' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <button onClick={() => handleEdit(booking)} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '12px' }}>✏️ Modifier</button>
                        <button onClick={() => { if(confirm('Supprimer cette réservation ?')) deleteBooking(booking.id); }} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '12px', color: '#ef4444' }}>🗑️ Supprimer</button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="checkbox" 
                          id={`shopify-${booking.id}`}
                          checked={booking.shopify_transfer || false}
                          onChange={(e) => toggleShopifyTransfer(booking.id, e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} 
                        />
                        <label htmlFor={`shopify-${booking.id}`} style={{ cursor: 'pointer', fontWeight: '500', color: isLate ? '#991B1B' : 'var(--text-muted)', fontSize: '14px' }}>
                          Transfert Shopify
                        </label>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="checkbox" 
                          id={`return-${booking.id}`}
                          onChange={(e) => {
                            if(e.target.checked) {
                              if(confirm('Confirmer que ce matériel a bien été rendu ?')) {
                                markBookingCompleted(booking.id);
                              } else {
                                e.target.checked = false;
                              }
                            }
                          }}
                          style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} 
                        />
                        <label htmlFor={`return-${booking.id}`} style={{ cursor: 'pointer', fontWeight: '600', color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                          Matériel Rendu
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <h2 style={{ marginTop: '40px' }}>Historique des réservations (Terminées)</h2>
          {pastBookings.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun historique disponible.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pastBookings.map(booking => {
                const isHighlighted = highlightedBookingId === booking.id;
                return (
                  <div key={booking.id} className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    borderLeft: `4px solid ${isHighlighted ? '#f59e0b' : '#10B981'}`, // Green for completed, Orange if highlighted
                    opacity: isHighlighted ? 1 : 0.8,
                    backgroundColor: isHighlighted ? '#FEF3C7' : 'var(--surface-color)',
                    padding: '16px',
                    boxShadow: isHighlighted ? '0 0 0 2px #f59e0b' : 'none',
                    transition: 'all 0.3s ease-in-out'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(booking.id)}
                      onChange={() => toggleSelect(booking.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: 'normal', backgroundColor: '#F3F4F6', padding: '2px 6px', borderRadius: '4px' }}>#{booking.reference || booking.id.split('-')[0].toUpperCase()}</span>
                          {formatName(booking.first_name, booking.last_name)}
                        </h3>
                        {booking.rental_type === 'wingboost' ? (
                          <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none' }}>🚀 Wingboost</span>
                        ) : booking.rental_type === 'demi_matin' ? (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none' }}>☀️ ½j (Matin)</span>
                        ) : booking.rental_type === 'demi_aprem' ? (
                          <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#D97706', border: 'none' }}>⛅ ½j (Aprem)</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', border: 'none' }}>🕒 Ponctuelle</span>
                        )}
                      </div>
                      <div style={{ margin: '8px 0', color: 'var(--text-main)' }}>
                        <strong>Matériel rendu ({booking.equipments?.length}) :</strong>
                        <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '14px' }}>
                          {booking.equipments?.map(eq => (
                            <li key={eq.id}>
                              {eq.name} (Réf: {eq.reference || 'N/A'})
                              {(eq.customStart || eq.customEnd) && (
                                <span style={{ marginLeft: '8px', color: '#6B7280', fontSize: '12px' }}>
                                  [
                                  {eq.customStart ? `Du ${new Date(eq.customStart).toLocaleDateString('fr-FR')}` : `Depuis le ${new Date(booking.start_date).toLocaleDateString('fr-FR')}`}
                                  {eq.customEnd ? ` au ${new Date(eq.customEnd).toLocaleDateString('fr-FR')}` : ''}
                                  ]
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                        Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                      </p>
                      {booking.pause_start && booking.pause_end && (() => {
                        const ps = new Date(booking.pause_start);
                        const pe = new Date(booking.pause_end);
                        if (pe >= ps) {
                          const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
                          const newEnd = new Date(booking.end_date);
                          newEnd.setDate(newEnd.getDate() + diffDays);
                          return (
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-light)', fontSize: '14px', fontStyle: 'italic' }}>
                              Pause du {ps.toLocaleDateString('fr-FR')} au {pe.toLocaleDateString('fr-FR')} et nouvelle fin le {newEnd.toLocaleDateString('fr-FR')}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: 'none' }}>✓ Rendu</span>
                      </div>
                      <button onClick={() => { if(confirm('Supprimer cette réservation ?')) deleteBooking(booking.id); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}>🗑️ Supprimer</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
