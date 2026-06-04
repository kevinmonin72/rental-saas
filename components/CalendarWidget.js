'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CalendarWidget.module.css';

// Helper to parse "YYYY-MM-DD" as local midnight
function parseLocalDate(dateString) {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateFr(date) {
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function formatShortDate(date) {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
}

function getDaysDiff(d1, d2) {
  // difference in days between two Date objects (ignoring time/DST if set to midnight)
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

function getRemainingMonths(endDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = parseLocalDate(endDateStr);
  end.setHours(0, 0, 0, 0);
  if (end <= today) return '0 jours';
  
  let months = (end.getFullYear() - today.getFullYear()) * 12 + (end.getMonth() - today.getMonth());
  let days = end.getDate() - today.getDate();
  
  if (days < 0) {
    months--;
    // Get the number of days in the previous month
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months > 0 && days > 0) {
    return `${months} mois et ${days} jour${days > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} mois`;
  } else {
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
}

export default function CalendarWidget({ bookings }) {
  const [baseDate, setBaseDate] = useState(null);

  // Initialize date on client to avoid Next.js Server/Client timezone hydration mismatches
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(today.getDate() - 2);
    setBaseDate(start);
  }, []);

  if (!baseDate) {
    return <div className={styles.container} style={{ padding: '40px', textAlign: 'center' }}>Chargement du calendrier...</div>;
  }

  const DAYS_TO_SHOW = 14;

  const viewStart = new Date(baseDate);
  const viewEnd = new Date(baseDate);
  viewEnd.setDate(baseDate.getDate() + DAYS_TO_SHOW - 1);

  // Generate day headers
  const days = [];
  for (let i = 0; i < DAYS_TO_SHOW; i++) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    days.push(d);
  }

  // Process bookings to flatten into individual equipment items with their own dates
  const processedItems = [];
  bookings.forEach(b => {
    let baseEnd = new Date(b.end_date);
    if (b.pause_start && b.pause_end) {
      const ps = new Date(b.pause_start);
      const pe = new Date(b.pause_end);
      if (pe >= ps) {
        const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
        baseEnd.setDate(baseEnd.getDate() + diffDays);
      }
    }
    
    if (b.equipments && b.equipments.length > 0) {
      b.equipments.forEach((eq, idx) => {
        const itemStart = eq.customStart ? new Date(eq.customStart) : new Date(b.start_date);
        const itemEnd = eq.customEnd ? new Date(eq.customEnd) : baseEnd;
        processedItems.push({
          ...b,
          unique_key: `${b.id}-${eq.id || idx}`,
          eq_name: eq.name,
          eq_ref: eq.reference,
          effective_start_date: itemStart.toISOString().split('T')[0],
          effective_end_date: itemEnd.toISOString().split('T')[0]
        });
      });
    } else {
      processedItems.push({
        ...b,
        unique_key: `${b.id}-no-eq`,
        eq_name: '',
        eq_ref: '',
        effective_start_date: b.start_date,
        effective_end_date: baseEnd.toISOString().split('T')[0]
      });
    }
  });

  // Filter items that overlap with the view window
  const visibleItems = processedItems.filter(item => {
    const bStart = parseLocalDate(item.effective_start_date);
    const bEnd = parseLocalDate(item.effective_end_date);
    return bEnd >= viewStart && bStart <= viewEnd;
  });

  const handlePrev = () => {
    const newBase = new Date(baseDate);
    newBase.setDate(baseDate.getDate() - 7);
    setBaseDate(newBase);
  };

  const handleNext = () => {
    const newBase = new Date(baseDate);
    newBase.setDate(baseDate.getDate() + 7);
    setBaseDate(newBase);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.headerTitle}>
          Locations du {formatDateFr(viewStart)} au {formatDateFr(viewEnd)}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.navButton} onClick={handlePrev}>&larr;</button>
          <button className={styles.navButton} onClick={handleNext}>&rarr;</button>
        </div>
      </div>

      <div className={styles.gantt}>
        {/* Header Row */}
        <div className={`${styles.row} ${styles.headerRow}`}>
          <div className={styles.cellName}>Client</div>
          <div className={styles.daysGrid}>
            {days.map((d, i) => (
              <div key={i} className={styles.dayHeader}>
                {formatShortDate(d)}
              </div>
            ))}
          </div>
        </div>

        {/* Booking Rows */}
        {visibleItems.length > 0 ? (
          visibleItems.map((item, i) => {
            const bStart = parseLocalDate(item.effective_start_date);
            const bEnd = parseLocalDate(item.effective_end_date);
            
            // Calculate grid columns
            // Column 1 is the first day. Column 15 is the end boundary.
            let startCol = getDaysDiff(viewStart, bStart) + 1;
            let endCol = getDaysDiff(viewStart, bEnd) + 2; // +1 for inclusive day, +1 for grid boundary

            // Clip to viewport
            if (startCol < 1) startCol = 1;
            if (endCol > DAYS_TO_SHOW + 1) endCol = DAYS_TO_SHOW + 1;

            return (
              <div key={item.unique_key} className={styles.row}>
                <div className={styles.cellName} style={{ backgroundColor: 'var(--surface-color)' }}>
                  <Link href={`/bookings?bookingId=${item.id}`} className={styles.clientLink}>
                    {item.first_name} {item.last_name} <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 'normal', marginLeft: '4px', whiteSpace: 'nowrap' }}>({getRemainingMonths(item.effective_end_date)})</span>
                  </Link>
                  {item.eq_name && (
                    <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.eq_name} {item.eq_ref ? `(${item.eq_ref})` : ''}
                    </div>
                  )}
                </div>
                <div className={styles.daysGrid}>
                  {/* Background grid lines */}
                  {days.map((_, i) => (
                    <div key={i} className={styles.dayCell} style={{ gridRow: 1, gridColumn: i + 1 }}></div>
                  ))}
                  
                  {/* The booking bar */}
                  <div 
                    className={styles.barContainer}
                    style={{ gridColumn: `${startCol} / ${endCol}`, gridRow: 1 }}
                  >
                    <Link href={`/bookings?bookingId=${item.id}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
                      <div className={styles.bar} title={`${item.eq_name} (Réf: ${item.eq_ref || 'N/A'})`}>
                        {item.rental_type === 'wingboost' ? '🚀 Wingboost' : 
                         item.rental_type === 'demi_matin' ? '☀️ ½j. Matin' :
                         item.rental_type === 'demi_aprem' ? '⛅ ½j. Aprem' : '🕒 Ponctuelle'}
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.noData}>
            Aucune location en cours sur cette période.
          </div>
        )}
      </div>
    </div>
  );
}
