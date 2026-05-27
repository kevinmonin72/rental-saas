'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function BookingsPage() {
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
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

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

  const filteredCustomersForSelect = customers.filter(c => {
    const term = customerSearch.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(term) || (c.email && c.email.toLowerCase().includes(term)) || (c.phone && c.phone.includes(term));
  }).slice(0, 100); // Limit to 100 to prevent DOM lag

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
      return bookings.some(b => {
        if (b.status !== 'active') return false;
        if (editingBookingId && b.id === editingBookingId) return false; // Ignore current booking if editing
        const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
        if (!bItems.some(bi => bi.equipment_id === eq.id)) return false;
        
        const sExist = new Date(b.start_date);
        sExist.setHours(0,0,0,0);
        const eExist = new Date(b.end_date);
        eExist.setHours(23,59,59,999);
        
        return (sNew <= eExist && sExist <= eNew);
      });
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
        equipmentIds: selectedEquipments.map(e => e.id),
        rentalType: rentalType
      });
      setEditingBookingId(null);
    } else {
      addBooking({
        customerId: selectedCustomerId,
        startDate: startDate,
        endDate: endDate,
        equipmentIds: selectedEquipments.map(e => e.id),
        rentalType: rentalType
      });
    }
    
    setSelectedEquipments([]);
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
  };

  const handleEdit = (booking) => {
    setEditingBookingId(booking.id);
    setSelectedCustomerId(booking.customer_id);
    setStartDate(booking.start_date);
    setEndDate(booking.end_date);
    setRentalType(booking.rental_type || 'ponctuel');
    setSelectedEquipments(booking.equipments);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingBookingId(null);
    setSelectedEquipments([]);
    setStartDate('');
    setEndDate('');
    setSelectedCustomerId('');
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

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const rawActiveBookings = getDetailedActiveBookings();
  const rawPastBookings = getDetailedPastBookings();

  const filterAndSort = (list) => {
    return list.filter(b => {
      if (!searchQuery) return true;
      const term = searchQuery.toLowerCase();
      const eqsStr = b.equipments?.map(eq => `${eq.name} ${eq.reference}`).join(' ') || '';
      const searchStr = `${b.first_name} ${b.last_name} ${eqsStr}`.toLowerCase();
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
                      {c.first_name} {c.last_name} {c.email ? `- ${c.email}` : ''} {c.phone ? `- ${c.phone}` : ''}
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
                      <div key={eq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px' }}>Réf: {eq.reference || 'N/A'} - {eq.name}</span>
                        <button type="button" onClick={() => setSelectedEquipments(selectedEquipments.filter(e => e.id !== eq.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '16px' }}>🗑️</button>
                      </div>
                    ))}
                  </div>
                )}

                <input 
                  type="text" 
                  className="input" 
                  placeholder="🔍 Filtrer par nom ou réf..." 
                  style={{ marginBottom: '8px' }}
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                />
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
                style={{ width: '280px', margin: 0 }}
              />
            </div>
          </div>

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
                const endDate = new Date(booking.end_date);
                endDate.setHours(0, 0, 0, 0);
                const isLate = endDate < today;

                return (
                  <div key={booking.id} className="card" style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    borderLeft: `4px solid ${isLate ? '#ef4444' : 'var(--primary-color)'}`,
                    backgroundColor: isLate ? '#FEF2F2' : 'var(--surface-color)',
                    padding: '16px'
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.includes(booking.id)}
                      onChange={() => toggleSelect(booking.id)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                          {booking.first_name} {booking.last_name}
                        </h3>
                        {booking.rental_type === 'wingboost' ? (
                          <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none' }}>🚀 Wingboost</span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', border: 'none' }}>🕒 Ponctuelle</span>
                        )}
                        {isLate && <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>En Retard</span>}
                      </div>
                      
                      <div style={{ margin: '8px 0', color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                        <strong>Matériel ({booking.equipments?.length}) :</strong>
                        <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '14px' }}>
                          {booking.equipments?.map(eq => (
                            <li key={eq.id}>{eq.name} (Réf: {eq.reference || 'N/A'})</li>
                          ))}
                        </ul>
                      </div>

                      <p style={{ margin: 0, color: isLate ? '#DC2626' : 'var(--text-light)', fontSize: '14px', fontWeight: isLate ? 'bold' : 'normal' }}>
                        Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                      </p>
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
              {pastBookings.map(booking => (
                <div key={booking.id} className="card" style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  borderLeft: '4px solid #10B981', // Green for completed
                  opacity: 0.8,
                  padding: '16px'
                }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(booking.id)}
                    onChange={() => toggleSelect(booking.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0, color: 'var(--text-main)' }}>
                        {booking.first_name} {booking.last_name}
                      </h3>
                      {booking.rental_type === 'wingboost' ? (
                        <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none' }}>🚀 Wingboost</span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: '#F3F4F6', color: '#374151', border: 'none' }}>🕒 Ponctuelle</span>
                      )}
                    </div>
                    <div style={{ margin: '8px 0', color: 'var(--text-main)' }}>
                      <strong>Matériel rendu ({booking.equipments?.length}) :</strong>
                      <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: '14px' }}>
                        {booking.equipments?.map(eq => (
                          <li key={eq.id}>{eq.name} (Réf: {eq.reference || 'N/A'})</li>
                        ))}
                      </ul>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '14px' }}>
                      Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge" style={{ backgroundColor: '#D1FAE5', color: '#065F46', border: 'none' }}>✓ Rendu</span>
                    </div>
                    <button onClick={() => { if(confirm('Supprimer cette réservation ?')) deleteBooking(booking.id); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px', color: '#ef4444' }}>🗑️ Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
