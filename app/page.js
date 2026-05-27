'use client';

import Link from 'next/link';
import CalendarWidget from '../components/CalendarWidget';
import ExportButton from '../components/ExportButton';
import { useStore } from '../lib/store';
import { useState, useEffect } from 'react';

export default function DashboardHome() {
  const [mounted, setMounted] = useState(false);
  const { getDashboardStats, getDetailedActiveBookings } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const stats = getDashboardStats();
  const activeBookingsList = getDetailedActiveBookings();

  return (
    <div>
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
                          <strong>Matériel :</strong> {booking.equipment_name} (x{booking.quantity})
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
