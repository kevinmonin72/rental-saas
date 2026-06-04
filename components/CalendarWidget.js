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

  // Process bookings to account for pauses
  const processedBookings = bookings.map(b => {
    let effectiveEnd = new Date(b.end_date);
    if (b.pause_start && b.pause_end) {
      const ps = new Date(b.pause_start);
      const pe = new Date(b.pause_end);
      if (pe >= ps) {
        const diffDays = Math.ceil(Math.abs(pe - ps) / (1000 * 60 * 60 * 24));
        effectiveEnd.setDate(effectiveEnd.getDate() + diffDays);
      }
    }
    return {
      ...b,
      effective_end_date: effectiveEnd.toISOString().split('T')[0]
    };
  });

  // Filter bookings that overlap with the view window
  const visibleBookings = processedBookings.filter(b => {
    const bStart = parseLocalDate(b.start_date);
    const bEnd = parseLocalDate(b.effective_end_date);
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
        {visibleBookings.length > 0 ? (
          visibleBookings.map((b, i) => {
            const bStart = parseLocalDate(b.start_date);
            const bEnd = parseLocalDate(b.effective_end_date);
            
            // Calculate grid columns
            // Column 1 is the first day. Column 15 is the end boundary.
            let startCol = getDaysDiff(viewStart, bStart) + 1;
            let endCol = getDaysDiff(viewStart, bEnd) + 2; // +1 for inclusive day, +1 for grid boundary

            // Clip to viewport
            if (startCol < 1) startCol = 1;
            if (endCol > DAYS_TO_SHOW + 1) endCol = DAYS_TO_SHOW + 1;

            return (
              <div key={`${b.id}-${i}`} className={styles.row}>
                <div className={styles.cellName} style={{ backgroundColor: 'var(--surface-color)' }}>
                  <Link href={`/bookings?bookingId=${b.id}`} className={styles.clientLink}>
                    {b.first_name} {b.last_name} <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 'normal', marginLeft: '4px', whiteSpace: 'nowrap' }}>({getRemainingMonths(b.effective_end_date)})</span>
                  </Link>
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
                    <Link href={`/bookings?bookingId=${b.id}`} style={{ display: 'block', height: '100%', textDecoration: 'none' }}>
                      <div className={styles.bar} title={(b.equipments?.map(eq => `${eq.name} (Réf: ${eq.reference || 'N/A'})`) || []).join(', ')}>
                        {b.rental_type === 'wingboost' ? '🚀 Wingboost' : 
                         b.rental_type === 'demi_matin' ? '☀️ ½j. Matin' :
                         b.rental_type === 'demi_aprem' ? '⛅ ½j. Aprem' : '🕒 Ponctuelle'}
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
