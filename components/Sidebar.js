'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  if (pathname === '/login') return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src="/logo.png" alt="THE RIDERY WINGBOOST" style={{ maxWidth: '100%', height: 'auto', maxHeight: '60px' }} />
      </div>
      <nav className="sidebar-nav">
        <Link href="/" className="sidebar-link">Tableau de bord</Link>
        <Link href="/bookings" className="sidebar-link">Réservations</Link>
        <Link href="/inventory" className="sidebar-link">Équipements</Link>
        <Link href="/customers" className="sidebar-link">Clients</Link>
      </nav>
    </aside>
  );
}
