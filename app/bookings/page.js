'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function BookingsPage() {
  const [mounted, setMounted] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const { 
    customers, 
    equipment, 
    bookings,
    bookingItems,
    addBooking, 
    markBookingCompleted, 
    getDetailedActiveBookings,
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

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const equipmentId = formData.get('equipmentId');
    const startDateStr = formData.get('startDate');
    const endDateStr = formData.get('endDate');
    
    const sNew = new Date(startDateStr);
    sNew.setHours(0,0,0,0);
    const eNew = new Date(endDateStr);
    eNew.setHours(23,59,59,999);

    // Check for overlap
    const isOverlapping = bookings.some(b => {
      if (b.status !== 'active') return false;
      const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
      if (!bItems.some(bi => bi.equipment_id === equipmentId)) return false;
      
      const sExist = new Date(b.start_date);
      sExist.setHours(0,0,0,0);
      const eExist = new Date(b.end_date);
      eExist.setHours(23,59,59,999);
      
      return (sNew <= eExist && sExist <= eNew);
    });

    if (isOverlapping) {
      const eq = equipment.find(eq => eq.id === equipmentId);
      alert(`Impossible : L'article (Réf: ${eq?.reference || 'N/A'}) est déjà réservé (non rendu) sur cette période !`);
      return;
    }

    addBooking({
      customerId: formData.get('customerId'),
      startDate: startDateStr,
      endDate: endDateStr,
      equipmentId: equipmentId
    });
    e.target.reset();
  };

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const activeBookings = getDetailedActiveBookings();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Réservations</h1>
        <CsvImporterButton type="bookings" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add Form */}
        <div className="card">
          <h2>Nouvelle Réservation</h2>
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
                <select name="customerId" className="input" required>
                  {filteredCustomersForSelect.length === 0 && <option value="">Aucun client trouvé</option>}
                  {filteredCustomersForSelect.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} {c.email ? `- ${c.email}` : ''} {c.phone ? `- ${c.phone}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Équipement</label>
                <select name="equipmentId" className="input" required>
                  {equipment.map(e => (
                    <option key={e.id} value={e.id}>Réf: {e.reference || 'N/A'} - {e.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date de début</label>
                <input type="date" name="startDate" className="input" required />
              </div>
              <div className="form-group">
                <label>Date de fin</label>
                <input type="date" name="endDate" className="input" required />
              </div>
              <button type="submit" className="btn btn-primary">Créer</button>
            </form>
          )}
        </div>

        {/* List */}
        <div>
          <h2>Réservations en cours</h2>
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
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderLeft: `4px solid ${isLate ? '#ef4444' : 'var(--primary-color)'}`,
                    backgroundColor: isLate ? '#FEF2F2' : 'var(--surface-color)'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ margin: 0, color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                          {booking.first_name} {booking.last_name}
                        </h3>
                        {isLate && <span className="badge" style={{ backgroundColor: '#ef4444', color: 'white', border: 'none' }}>En Retard</span>}
                      </div>
                      <p style={{ margin: '0 0 4px 0', color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                        <strong>Matériel :</strong> {booking.equipment_name} (Réf: {booking.equipment_reference || 'N/A'})
                      </p>
                      <p style={{ margin: 0, color: isLate ? '#DC2626' : 'var(--text-light)', fontSize: '14px', fontWeight: isLate ? 'bold' : 'normal' }}>
                        Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', backgroundColor: isLate ? '#FEE2E2' : '#F9F9F9', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input 
                          type="checkbox" 
                          id={`shopify-${booking.id}`}
                          checked={booking.shopify_transfer || false}
                          onChange={(e) => toggleShopifyTransfer(booking.id, e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-color)' }} 
                        />
                        <label htmlFor={`shopify-${booking.id}`} style={{ cursor: 'pointer', fontWeight: '500', color: isLate ? '#991B1B' : 'var(--text-muted)', fontSize: '14px' }}>
                          Transfert sur Shopify effectué
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
                          Matériel Rendu (Terminer)
                        </label>
                      </div>
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
