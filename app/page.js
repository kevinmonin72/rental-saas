import { openDb } from '../lib/db';

async function getStats() {
  const db = await openDb();
  
  const equipmentCount = await db.get('SELECT COUNT(*) as count FROM equipment');
  const customerCount = await db.get('SELECT COUNT(*) as count FROM customers');
  const activeBookings = await db.get(`
    SELECT COUNT(*) as count FROM bookings 
    WHERE status != 'completed'
  `);

  const activeBookingsList = await db.all(`
    SELECT 
      b.id, b.start_date, b.end_date, b.status,
      c.first_name, c.last_name,
      e.name as equipment_name,
      bi.quantity
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN booking_items bi ON b.id = bi.booking_id
    JOIN equipment e ON bi.equipment_id = e.id
    WHERE b.status != 'completed'
    ORDER BY b.start_date ASC
  `);

  return {
    equipment: equipmentCount.count,
    customers: customerCount.count,
    activeBookings: activeBookings.count,
    activeBookingsList
  };
}

import CalendarWidget from '../components/CalendarWidget';

export default async function DashboardHome() {
  const stats = await getStats();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Tableau de bord</h1>
        <a href="/api/export" className="btn btn-secondary" download>
          Exporter les données (.zip)
        </a>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Réservations en cours</h3>
          <p style={{ fontSize: '32px', fontWeight: '700', color: 'var(--primary-color)' }}>
            {stats.activeBookings}
          </p>
        </div>
        
        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Équipements</h3>
          <p style={{ fontSize: '32px', fontWeight: '700' }}>
            {stats.equipment}
          </p>
        </div>

        <div className="card">
          <h3 style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Clients</h3>
          <p style={{ fontSize: '32px', fontWeight: '700' }}>
            {stats.customers}
          </p>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <CalendarWidget bookings={stats.activeBookingsList} />
      </div>
    </div>
  );
}
