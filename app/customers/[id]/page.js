'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../../../lib/store';
import { supabaseProxy as supabase } from '../../../lib/supabase-proxy';

const formatName = (f, l) => {
  const sf = (!f || f === 'undefined' || f === 'null') ? '' : f;
  const sl = (!l || l === 'undefined' || l === 'null') ? '' : l;
  return `${sf} ${sl}`.trim();
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const STATUS_LABEL = {
  active: { label: 'En cours', color: '#16a34a', bg: '#dcfce7' },
  completed: { label: 'Terminée', color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2' },
};

export default function CustomerHistoryPage() {
  const { id } = useParams();
  const [mounted, setMounted] = useState(false);
  const [history, setHistory] = useState({ bookings: [], items: [], equipment: [] });
  const [loadingHistory, setLoadingHistory] = useState(true);
  const { customers } = useStore();

  useEffect(() => { 
    setMounted(true); 
    const loadHistory = async () => {
      try {
        const { data: bData } = await supabase.from('bookings').select('*').eq('customer_id', id).order('start_date', { ascending: false });
        if (!bData || bData.length === 0) {
          setHistory({ bookings: [], items: [], equipment: [] });
          setLoadingHistory(false);
          return;
        }
        const { data: iData } = await supabase.from('booking_items').select('*').in('booking_id', bData.map(b => b.id));
        const eqIds = iData ? Array.from(new Set(iData.map(i => i.equipment_id).filter(Boolean))) : [];
        let eData = [];
        if (eqIds.length > 0) {
          const res = await supabase.from('equipment').select('*').in('id', eqIds);
          if (res.data) eData = res.data;
        }
        setHistory({ bookings: bData, items: iData || [], equipment: eData });
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [id]);

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  const customer = customers.find(c => c.id === id);
  if (!customer) return (
    <div style={{ padding: '24px' }}>
      <Link href="/customers" style={{ color: 'var(--primary-color)' }}>← Retour clients</Link>
      <p style={{ marginTop: '16px', color: 'var(--text-light)' }}>Client introuvable.</p>
    </div>
  );

  const customerBookings = history.bookings;
  const totalBookings = customerBookings.length;
  const activeBookings = customerBookings.filter(b => b.status === 'active').length;
  const completedBookings = customerBookings.filter(b => b.status === 'completed').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <Link
          href="/customers"
          style={{
            textDecoration: 'none', fontSize: '20px', color: 'var(--text-main)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '50%',
            backgroundColor: 'white', border: '1px solid var(--border-color)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer'
          }}
        >←</Link>
        <div>
          <h1 style={{ margin: 0 }}>{formatName(customer.first_name, customer.last_name)}</h1>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px', fontSize: '14px', color: 'var(--text-light)', flexWrap: 'wrap' }}>
            {customer.email && <span>✉️ {customer.email}</span>}
            {customer.phone && <span>📞 {customer.phone}</span>}
            {customer.address && <span>📍 {customer.address}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total réservations', value: totalBookings, color: '#1e40af', bg: '#dbeafe' },
          { label: 'En cours', value: activeBookings, color: '#16a34a', bg: '#dcfce7' },
          { label: 'Terminées', value: completedBookings, color: '#6b7280', bg: '#f3f4f6' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '32px', fontWeight: '700', color, marginBottom: '4px' }}>{value}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* History */}
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Historique des réservations</h2>

        {loadingHistory ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '40px 0' }}>
            Chargement de l'historique...
          </p>
        ) : customerBookings.length === 0 ? (
          <p style={{ color: 'var(--text-light)', textAlign: 'center', padding: '40px 0' }}>
            Aucune réservation pour ce client.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customerBookings.map(booking => {
              const items = history.items.filter(bi => bi.booking_id === booking.id);
              const statusInfo = STATUS_LABEL[booking.status] || STATUS_LABEL.completed;

              return (
                <div
                  key={booking.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '16px 20px',
                    backgroundColor: 'var(--bg-color)',
                  }}
                >
                  {/* Booking header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '2px' }}>
                        {formatDate(booking.start_date)} → {formatDate(booking.end_date)}
                      </div>
                      {booking.rental_type && (
                        <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                          {booking.rental_type.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                    <span style={{
                      fontSize: '12px', fontWeight: '600',
                      color: statusInfo.color, backgroundColor: statusInfo.bg,
                      padding: '3px 10px', borderRadius: '20px'
                    }}>
                      {statusInfo.label}
                    </span>
                  </div>

                  {/* Equipment list */}
                  {items.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {items.map((item, idx) => {
                        const eq = history.equipment.find(e => e.id === item.equipment_id);
                        const label = eq ? (eq.reference || eq.name || eq.type || 'Équipement') : (item.generic_label || 'Équipement');
                        return (
                          <span key={idx} style={{
                            fontSize: '12px', backgroundColor: 'white',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px', padding: '2px 10px',
                            color: 'var(--text-main)'
                          }}>
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {booking.notes && (
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-light)', fontStyle: 'italic' }}>
                      💬 {booking.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
