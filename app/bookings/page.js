import { openDb } from '../../lib/db';
import { createBooking } from '../actions';
import CsvImporterButton from '../../components/CsvImporterButton';

export default async function BookingsPage() {
  const db = await openDb();
  
  // Fetch required data for the form
  const customers = await db.all('SELECT id, first_name, last_name FROM customers ORDER BY first_name ASC');
  const equipment = await db.all('SELECT id, name, category FROM equipment ORDER BY name ASC');
  
  // Fetch existing bookings with details
  const bookingsList = await db.all(`
    SELECT 
      b.id, b.start_date, b.end_date, b.status,
      c.first_name, c.last_name,
      e.name as equipment_name,
      bi.quantity
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN booking_items bi ON b.id = bi.booking_id
    JOIN equipment e ON bi.equipment_id = e.id
    ORDER BY b.start_date DESC
  `);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Réservations</h1>
        <CsvImporterButton type="bookings" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Formulaire de création */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Nouvelle Réservation</h2>
          <form action={createBooking} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="customerId" style={{ fontWeight: 500, fontSize: '14px' }}>Client</label>
              <select id="customerId" name="customerId" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                <option value="">Sélectionner un client...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="equipmentId" style={{ fontWeight: 500, fontSize: '14px' }}>Équipement</label>
              <select id="equipmentId" name="equipmentId" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'white' }}>
                <option value="">Sélectionner un équipement...</option>
                {equipment.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="quantity" style={{ fontWeight: 500, fontSize: '14px' }}>Quantité</label>
              <input type="number" id="quantity" name="quantity" min="1" defaultValue="1" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="startDate" style={{ fontWeight: 500, fontSize: '14px' }}>Date de début</label>
                <input type="date" id="startDate" name="startDate" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label htmlFor="endDate" style={{ fontWeight: 500, fontSize: '14px' }}>Date de fin</label>
                <input type="date" id="endDate" name="endDate" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Créer la réservation
            </button>
          </form>
        </div>

        {/* Liste des réservations */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Réservations ({bookingsList.length})</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Réf</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Client</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Équipement</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Dates</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {bookingsList.map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>#{b.id}</td>
                  <td style={{ padding: '12px 0', fontWeight: 500 }}>{b.first_name} {b.last_name}</td>
                  <td style={{ padding: '12px 0' }}>{b.quantity}x {b.equipment_name}</td>
                  <td style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    {b.start_date} au {b.end_date}
                  </td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ backgroundColor: '#E8F5E9', color: '#2E7D32', padding: '4px 8px', borderRadius: '12px', fontSize: '13px', fontWeight: 500 }}>
                      Confirmé
                    </span>
                  </td>
                </tr>
              ))}
              {bookingsList.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucune réservation trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
