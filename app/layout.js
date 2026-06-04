'use client';

import './globals.css';
import './layout.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from '../components/Sidebar';
import ClientAuth from '../components/ClientAuth';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isPublicPage = pathname === '/book';

  if (isPublicPage) {
    return (
      <html lang="fr">
        <body>
          <main style={{ minHeight: '100vh', backgroundColor: 'var(--bg-color)' }}>
            {children}
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="fr">
      <body>
        <ClientAuth>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        </ClientAuth>
      </body>
    </html>
  );
}
