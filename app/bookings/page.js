'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function BookingsPage() {
  const [mounted, setMounted] = useState(false);
  const { 
    customers, 
    equipment, 
    addBooking, 
    markBookingCompleted, 
    getDetailedActiveBookings 
  } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addBooking({
      customerId: formData.get('customerId'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      equipmentId: formData.get('equipmentId'),
      quantity: parseInt(formData.get('quantity'), 10) || 1
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
                <select name="customerId" className="input" required>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Équipement</label>
                <select name="equipmentId" className="input" required>
                  {equipment.map(e => (
                    <option key={e.id} value={e.id}>{e.name} (Dispo: {e.quantity})</option>
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
              <div className="form-group">
                <label>Quantité</label>
                <input type="number" name="quantity" className="input" min="1" defaultValue="1" required />
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
                        <strong>Matériel :</strong> {booking.equipment_name} (x{booking.quantity})
                      </p>
                      <p style={{ margin: 0, color: isLate ? '#DC2626' : 'var(--text-light)', fontSize: '14px', fontWeight: isLate ? 'bold' : 'normal' }}>
                        Du {new Date(booking.start_date).toLocaleDateString('fr-FR')} au {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: isLate ? '#FEE2E2' : '#F9F9F9', borderRadius: '8px' }}>
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
                      <label htmlFor={`return-${booking.id}`} style={{ cursor: 'pointer', fontWeight: '500', color: isLate ? '#991B1B' : 'var(--text-main)' }}>
                        Matériel Rendu (Terminer)
                      </label>
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
