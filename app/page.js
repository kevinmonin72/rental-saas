'use client';

import Link from 'next/link';
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

      {/* Calendar View for Active Bookings */}
      <CalendarWidget bookings={activeBookingsList} />
    </div>
  );
}
