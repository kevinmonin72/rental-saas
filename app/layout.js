import './globals.css';
import './layout.css';
import Link from 'next/link';

export const metadata = {
  title: 'THE RIDERY WINGBOOST - Admin',
  description: 'Internal equipment rental management system',
};

function Sidebar() {
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

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
