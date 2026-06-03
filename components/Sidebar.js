'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  const isSettingsActive = pathname === '/settings' || pathname === '/inventory' || pathname === '/customers';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="THE RIDERY WINGBOOST" style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px' }} />
      </div>
      <nav className="sidebar-nav">
        <Link href="/" className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}>
          Tableau de bord
        </Link>
        <Link href="/bookings" className={`sidebar-link ${pathname === '/bookings' ? 'active' : ''}`}>
          Réservations
        </Link>
        <Link href="/settings" className={`sidebar-link ${isSettingsActive ? 'active' : ''}`}>
          Paramètres
        </Link>
      </nav>
    </aside>
  );
}
