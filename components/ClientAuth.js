'use client';

import { useState, useEffect } from 'react';

import { useStore } from '../lib/store';

const ADMIN_USERNAME = "marketing@theridery.com";
const ADMIN_PASSWORD = "Theriderywingboost2K26!!";

export default function ClientAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { fetchData, isLoaded } = useStore();

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('admin_session_token');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoaded) {
      fetchData();
    }
  }, [isAuthenticated, isLoaded, fetchData]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (adminId === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_session_token', 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Identifiant ou mot de passe incorrect');
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
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label>Identifiant</label>
              <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="input" placeholder="marketing@theridery.com" required />
            </div>
            <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
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

  if (isAuthenticated && !isLoaded) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)', flexDirection: 'column', gap: '16px' }}>
        <img src="/logo.png" alt="Loading" style={{ maxWidth: '150px', opacity: 0.5 }} />
        <div style={{ color: 'var(--text-light)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>
          Connexion au Cloud en cours...
        </div>
      </div>
    );
  }

  return children;
}
