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
  const { getDashboardStats, getDetailedActiveBookings, fetchData, bookings, bookingItems } = useStore();

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

  // Group Wingboost bookings by month (last 6 months)
  const getWingboostStatsByMonth = () => {
    const months = {};
    const today = new Date();
    
    // Generate the last 6 months keys & labels
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      months[key] = { key, label, count: 0 };
    }

    // Count wingboost bookings matching month keys
    bookings.forEach(b => {
      if (b.rental_type === 'wingboost') {
        const start = new Date(b.start_date);
        const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
        if (months[key]) {
          months[key].count++;
        }
      }
    });

    return Object.values(months);
  };

  // Group active bookings by expected return month (current month + 5 next months)
  const getExpectedReturnsByMonth = () => {
    const months = {};
    const today = new Date();
    
    // Generate current + 5 next months keys & labels
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('fr-FR', { month: 'short' });
      months[key] = { key, label, count: 0 };
    }

    // Count expected returns in these months
    bookings.forEach(b => {
      if (b.status === 'active') {
        const bItems = bookingItems.filter(bi => bi.booking_id === b.id);
        
        // Base end date of the booking
        let baseEndDate = new Date(b.end_date);
        if (b.pause_start && b.pause_end) {
          const ps = new Date(b.pause_start);
          const pe = new Date(b.pause_end);
          if (pe >= ps) {
            const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
            baseEndDate.setDate(baseEndDate.getDate() + diffDays);
          }
        }
        
        if (bItems.length > 0) {
          bItems.forEach(item => {
            const itemEndDate = item.end_date ? new Date(item.end_date) : baseEndDate;
            const key = `${itemEndDate.getFullYear()}-${String(itemEndDate.getMonth() + 1).padStart(2, '0')}`;
            if (months[key]) {
              months[key].count++; // Count each equipment return
            }
          });
        } else {
          // If no items, just use the booking end date
          const key = `${baseEndDate.getFullYear()}-${String(baseEndDate.getMonth() + 1).padStart(2, '0')}`;
          if (months[key]) {
            months[key].count++;
          }
        }
      }
    });

    return Object.values(months);
  };

  const getBarHeight = (count, max) => {
    if (max === 0) return '0%';
    return `${(count / max) * 100}%`;
  };

  const stats = getDashboardStats();
  const activeBookingsList = getDetailedActiveBookings();
  const wingboostStats = getWingboostStatsByMonth();
  const maxWingboost = Math.max(...wingboostStats.map(s => s.count), 1);

  const returnsStats = getExpectedReturnsByMonth();
  const maxReturns = Math.max(...returnsStats.map(s => s.count), 1);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .chart-bar-container {
          position: relative;
        }
        .chart-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translate(-50%, -4px);
          background-color: #1F2937;
          color: #FFFFFF;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease, transform 0.15s ease;
          white-space: nowrap;
          z-index: 50;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .chart-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border-width: 4px;
          border-style: solid;
          border-color: #1F2937 transparent transparent transparent;
        }
        .chart-bar-container:hover .chart-tooltip {
          opacity: 1;
          transform: translate(-50%, -8px);
        }
      `}} />
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
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        
        {/* Réservations Actives */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', minHeight: '220px' }}>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Réservations Actives</h2>
            <p style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--primary-color)', margin: '16px 0 8px 0', lineHeight: '1' }}>{stats.activeBookings}</p>
          </div>
          <Link href="/bookings" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Voir les détails →
          </Link>
        </div>

        {/* Wingboost par mois (Évolution) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', minHeight: '220px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '16px' }}>Wingboost par mois (Évolution)</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '110px', padding: '0 8px', borderBottom: '1px solid var(--border-color)', flex: 1 }}>
            {wingboostStats.map((s, idx) => {
              const heightPct = getBarHeight(s.count, maxWingboost);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', margin: '0 6px', position: 'relative' }} className="chart-bar-container">
                  {/* Tooltip showing number of people */}
                  <div className="chart-tooltip">
                    {s.count} {s.count > 1 ? 'personnes' : 'personne'}
                  </div>
                  {/* Bar */}
                  <Link 
                    href={`/bookings?startMonth=${s.key}&rentalType=wingboost`}
                    style={{ display: 'block', width: '100%', height: heightPct }}
                  >
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }} 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                      }}
                    />
                  </Link>
                  
                  {/* Label */}
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '6px', textAlign: 'center', width: '100%', textTransform: 'capitalize' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Retours prévus (Mois en cours & suiv.) */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', minHeight: '220px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '16px' }}>Retours prévus (Mois en cours & suiv.)</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '110px', padding: '0 8px', borderBottom: '1px solid var(--border-color)', flex: 1 }}>
            {returnsStats.map((s, idx) => {
              const heightPct = getBarHeight(s.count, maxReturns);
              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end', margin: '0 6px', position: 'relative' }} className="chart-bar-container">
                  {/* Tooltip showing number of people */}
                  <div className="chart-tooltip">
                    {s.count} {s.count > 1 ? 'personnes' : 'personne'}
                  </div>
                  {/* Bar */}
                  <Link 
                    href={`/bookings?endMonth=${s.key}`}
                    style={{ display: 'block', width: '100%', height: heightPct }}
                  >
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(180deg, #F97316 0%, #C2410C 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }} 
                      onMouseEnter={(e) => {
                        e.currentTarget.style.filter = 'brightness(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = 'none';
                      }}
                    />
                  </Link>
                  
                  {/* Label */}
                  <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '6px', textAlign: 'center', width: '100%', textTransform: 'capitalize' }}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Alertes / Retards */}
      {(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lateBookings = activeBookingsList.filter(b => {
          let endDate = new Date(b.end_date);
          if (b.pause_start && b.pause_end) {
            const ps = new Date(b.pause_start);
            const pe = new Date(b.pause_end);
            if (pe >= ps) {
              const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
              endDate.setDate(endDate.getDate() + diffDays);
            }
          }
          endDate.setHours(0, 0, 0, 0);
          
          let isLate = endDate < today;
          if (!isLate && b.equipments) {
            isLate = b.equipments.some(eq => {
              if (eq.is_returned) return false;
              if (eq.customEnd) {
                const eqEndDate = new Date(eq.customEnd);
                eqEndDate.setHours(0, 0, 0, 0);
                return eqEndDate < today;
              }
              return false;
            });
          }
          return isLate;
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
                        <h3 style={{ margin: '0 0 8px 0', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: '#B91C1C', fontWeight: 'normal', backgroundColor: '#FEE2E2', padding: '2px 6px', borderRadius: '4px' }}>#{booking.reference || booking.id.split('-')[0].toUpperCase()}</span>
                          {booking.first_name} {booking.last_name}
                        </h3>
                        {(() => {
                          let effectiveEnd = new Date(booking.end_date);
                          if (booking.pause_start && booking.pause_end) {
                            const ps = new Date(booking.pause_start);
                            const pe = new Date(booking.pause_end);
                            if (pe >= ps) {
                              const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
                              effectiveEnd.setDate(effectiveEnd.getDate() + diffDays);
                            }
                          }
                          effectiveEnd.setHours(0, 0, 0, 0);
                          
                          const isFullBookingLate = effectiveEnd < today;
                          let lateEquipments = booking.equipments || [];
                          
                          if (!isFullBookingLate) {
                            lateEquipments = lateEquipments.filter(eq => {
                              if (eq.is_returned) return false;
                              if (eq.customEnd) {
                                const eqEnd = new Date(eq.customEnd);
                                eqEnd.setHours(0,0,0,0);
                                return eqEnd < today;
                              }
                              return false;
                            });
                          }

                          return (
                            <>
                              <p style={{ margin: '0 0 4px 0', color: '#991B1B' }}>
                                <strong>Matériel en retard :</strong> {lateEquipments.map(eq => `${eq.name} (Réf: ${eq.reference || 'N/A'})`).join(', ')}
                                {(!isFullBookingLate && booking.equipments && booking.equipments.length > lateEquipments.length) && 
                                  <span style={{ fontSize: '12px', color: '#B91C1C', fontStyle: 'italic' }}> (+ {booking.equipments.length - lateEquipments.length} autre(s) non en retard)</span>
                                }
                              </p>
                              {isFullBookingLate ? (
                                <p style={{ margin: 0, color: '#DC2626', fontWeight: 'bold' }}>
                                  L'abonnement complet devait être rendu le {effectiveEnd.toLocaleDateString('fr-FR')}
                                </p>
                              ) : (
                                <p style={{ margin: 0, color: '#DC2626', fontWeight: 'bold' }}>
                                  Un (ou plusieurs) équipement est en retard !
                                </p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <Link href={`/bookings?bookingId=${booking.id}`} className="btn btn-primary" style={{ backgroundColor: '#ef4444' }}>
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
