import './globals.css';
import './layout.css';
import Link from 'next/link';

export const metadata = {
  title: 'THE RIDERY WINGBOOST - Admin',
  description: 'Internal equipment rental management system',
};

import Sidebar from '../components/Sidebar';

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
