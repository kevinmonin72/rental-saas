'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import PushNotificationButton from './PushNotificationButton';
import { useStore } from '../lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { location, setLocation } = useStore();
  
  if (pathname === '/login') return null;

  const isActive = (href, exact = false, also = []) => {
    if (exact) return pathname === href;
    if (also.length) return pathname === href || also.includes(pathname);
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const linkClass = (href, exact = false, also = []) =>
    `sidebar-link ${isActive(href, exact, also) ? 'active' : ''}`;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="THE RIDERY LOCATION" />
      </div>

      <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
        <select 
          value={location} 
          onChange={(e) => setLocation(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--surface-color)',
            color: 'var(--text-color)',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <option value="marseille">📍 Marseille</option>
          <option value="paris">📍 Paris</option>
        </select>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-title">Administration</p>
        <nav className="sidebar-nav">
          <Link href="/" className={linkClass('/', true)}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
            Tableau de bord
          </Link>
          <Link href="/bookings" className={linkClass('/bookings')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            Réservations
          </Link>
          <Link href="/promocodes" className={linkClass('/promocodes')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
            Codes Promo
          </Link>
          <Link href="/customers" className={linkClass('/customers')}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Clients
          </Link>

        </nav>
      </div>

      <div className="sidebar-section sidebar-section-bottom">
        <p className="sidebar-section-title">Système</p>
        <nav className="sidebar-nav">
          <PushNotificationButton />
          <Link href="/settings" className={linkClass('/settings', false, ['/inventory'])}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Paramètres & Accès
          </Link>
          <button onClick={handleLogout} className="sidebar-link" style={{ color: '#ef4444', marginTop: '10px', width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Déconnexion
          </button>
        </nav>
      </div>
    </aside>
  );
}
