'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);

  // Auto-expand menu if the user is on inventory or customers page
  useEffect(() => {
    if (pathname === '/inventory' || pathname === '/customers') {
      setIsOpen(true);
    }
  }, [pathname]);

  if (pathname === '/login') return null;

  const isSettingsActive = pathname === '/inventory' || pathname === '/customers';

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
        
        {/* Settings collapsible dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button 
            type="button"
            onClick={() => setIsOpen(!isOpen)} 
            className={`sidebar-link ${isSettingsActive ? 'active' : ''}`}
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              width: '100%', 
              background: 'none', 
              border: 'none', 
              textAlign: 'left',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'inherit'
            }}
          >
            <span>Paramètres</span>
            <span style={{ 
              fontSize: '10px', 
              transition: 'transform 0.2s ease', 
              transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
              color: isSettingsActive ? 'var(--primary-color)' : 'var(--text-light)'
            }}>
              ▼
            </span>
          </button>
          
          {isOpen && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
              <Link href="/inventory" className={`sidebar-sublink ${pathname === '/inventory' ? 'active' : ''}`}>
                Équipements
              </Link>
              <Link href="/customers" className={`sidebar-sublink ${pathname === '/customers' ? 'active' : ''}`}>
                Clients
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
