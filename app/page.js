'use client';

import Link from 'next/link';
import CalendarWidget from '../components/CalendarWidget';
import ExportButton from '../components/ExportButton';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false);
  const [localDataToMigrate, setLocalDataToMigrate] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const { getDashboardStats, getDetailedActiveBookings, fetchData } = useStore();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('rental-saas-storage');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state && (parsed.state.customers?.length > 0 || parsed.state.equipment?.length > 0)) {
          setLocalDataToMigrate(parsed.state);
        }
      }
    } catch(e) {}
  }, []);

  const handleMigration = async () => {
    if (!localDataToMigrate) return;
    setIsMigrating(true);
    try {
      const { equipment, customers, bookings, bookingItems } = localDataToMigrate;
      if (equipment?.length > 0) await supabase.from('equipment').upsert(equipment.map(e => ({...e, quantity: 1})), { onConflict: 'id' });
      if (customers?.length > 0) await supabase.from('customers').upsert(customers, { onConflict: 'id' });
      if (bookings?.length > 0) await supabase.from('bookings').upsert(bookings.map(b => ({...b, shopify_transfer: !!b.shopify_transfer})), { onConflict: 'id' });
      if (bookingItems?.length > 0) await supabase.from('booking_items').upsert(bookingItems, { onConflict: 'id' });
      
      localStorage.removeItem('rental-saas-storage');
      setLocalDataToMigrate(null);
      await fetchData();
      alert("Migration réussie ! Vos données locales sont maintenant dans le Cloud.");
    } catch(err) {
      console.error(err);
      alert("Erreur lors de la migration: " + err.message);
    }
    setIsMigrating(false);
  };

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const stats = getDashboardStats();
  const activeBookingsList = getDetailedActiveBookings();

  return (
    <div>
      {localDataToMigrate && (
        <div style={{ backgroundColor: '#FEF3C7', border: '1px solid #F59E0B', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: '#92400E' }}>Anciennes données locales détectées !</h3>
            <p style={{ margin: 0, color: '#92400E', fontSize: '14px' }}>Vous avez {localDataToMigrate.customers?.length || 0} clients et {localDataToMigrate.equipment?.length || 0} équipements sauvegardés localement. Voulez-vous les envoyer vers Supabase ?</p>
          </div>
          <button onClick={handleMigration} disabled={isMigrating} className="btn btn-primary" style={{ backgroundColor: '#D97706', border: 'none' }}>
            {isMigrating ? 'Migration...' : 'Migrer vers le Cloud'}
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Tableau de bord</h1>
        <ExportButton />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
        <div className="card">
          <h2>Réservations Actives</h2>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.activeBookings}</p>
          <Link href="/bookings" style={{ color: 'var(--text-color)', textDecoration: 'underline' }}>Voir les détails</Link>
        </div>
        <div className="card">
          <h2>Matériel Disponible</h2>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.availableEquipmentCount}</p>
          <Link href="/inventory" style={{ color: 'var(--text-color)', textDecoration: 'underline' }}>Gérer le stock</Link>
        </div>
        <div className="card">
          <h2>Total Clients</h2>
          <p style={{ fontSize: '36px', fontWeight: 'bold', color: 'var(--primary-color)' }}>{stats.totalCustomers}</p>
          <Link href="/customers" style={{ color: 'var(--text-color)', textDecoration: 'underline' }}>Voir les clients</Link>
        </div>
      </div>

      {/* Alertes / Retards */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lateBookings = activeBookingsList.filter(b => {
          const endDate = new Date(b.end_date);
          endDate.setHours(0, 0, 0, 0);
          return endDate < today;
        });

        if (lateBookings.length > 0) {
          return (
            <div style={{ marginTop: '40px', marginBottom: '24px' }}>
              <h2 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚠️ Alertes : Retours en retard
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {lateBookings.map(booking => (
                  <div key={booking.id} className="card" style={{ borderLeft: '4px solid #ef4444', backgroundColor: '#FEF2F2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 8px 0', color: '#991B1B' }}>{booking.first_name} {booking.last_name}</h3>
                        <p style={{ margin: '0 0 4px 0', color: '#991B1B' }}>
                          <strong>Matériel :</strong> {booking.equipment_name} (Réf: {booking.equipment_reference || 'N/A'})
                        </p>
                        <p style={{ margin: 0, color: '#DC2626', fontWeight: 'bold' }}>
                          Devait être rendu le {new Date(booking.end_date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Link href="/bookings" className="btn btn-primary" style={{ backgroundColor: '#ef4444' }}>
                        Gérer
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Calendar View for Active Bookings */}
      <CalendarWidget bookings={activeBookingsList} />
    </div>
  );
}
