'use client';

import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = "Theriderywingboost2K26!!";

export default function ClientAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('auth_token');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('auth_token', 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <img src="/logo.png" alt="THE RIDERY WINGBOOST" style={{ maxWidth: '200px', marginBottom: '32px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Accès sécurisé</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Mot de passe</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••••••" required />
            </div>
            {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Se connecter</button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
