'use client';

import { useState, useEffect } from 'react';
import { useStore } from '../lib/store';

export default function ClientAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // 2FA states
  const [step, setStep] = useState(1);
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { fetchData, isLoaded } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Erreur vérification session', err);
      } finally {
        setMounted(true);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoaded) {
      fetchData();
    }
  }, [isAuthenticated, isLoaded, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        if (data.bypass2FA) {
          setIsAuthenticated(true);
        } else {
          setStep(2);
        }
      } else {
        setError(data.error || 'Identifiant ou mot de passe incorrect');
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.");
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: userCode })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setIsAuthenticated(true);
        setError('');
      } else {
        setError(data.error || 'Code de vérification incorrect');
      }
    } catch (err) {
      setError("Erreur de vérification.");
    }
    setLoading(false);
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <img src="/logo.png" alt="THE RIDERY LOCATION" style={{ maxWidth: '200px', marginBottom: '32px' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '24px', fontFamily: 'var(--font-display)' }}>Accès sécurisé</h1>
          
          {step === 1 ? (
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '16px' }}>
                <label>Identifiant</label>
                <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} className="input" placeholder="Saisissez votre identifiant" required />
              </div>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label>Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••••••" required />
              </div>
              {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Vérification...' : 'Se connecter'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyCode}>
              <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-light)' }}>
                Un code à 6 chiffres a été envoyé à <strong>{adminId || 'marketing@theridery.com'}</strong>.
              </div>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '24px' }}>
                <label>Code de sécurité</label>
                <input 
                  type="text" 
                  value={userCode} 
                  onChange={(e) => setUserCode(e.target.value)} 
                  className="input" 
                  placeholder="Ex: 123456" 
                  required 
                  maxLength={6}
                  style={{ textAlign: 'center', fontSize: '20px', letterSpacing: '2px' }}
                />
              </div>
              {error && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '14px' }}>{error}</div>}
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Validation...' : 'Valider'}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', marginTop: '16px', cursor: 'pointer', textDecoration: 'underline' }}>
                Retour
              </button>
            </form>
          )}
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
