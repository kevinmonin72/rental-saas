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
  
  // 2FA states
  const [step, setStep] = useState(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { fetchData, isLoaded } = useStore();

  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem('admin_session_token_v2');
    if (auth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && !isLoaded) {
      fetchData();
    }
  }, [isAuthenticated, isLoaded, fetchData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (adminId.trim().toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
      setLoading(true);
      setError('');
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);
      
      try {
        await fetch('/api/2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });
        setStep(2);
      } catch (err) {
        setError("Erreur lors de l'envoi du code.");
      }
      setLoading(false);
    } else {
      setError('Identifiant ou mot de passe incorrect');
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (userCode === generatedCode) {
      localStorage.setItem('admin_session_token_v2', 'authenticated');
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Code de vérification incorrect');
    }
  };

  if (!mounted) return null;

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-color)' }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px', backgroundColor: 'var(--surface-color)', borderRadius: 'var(--border-radius-lg)', boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
          <img src="/logo.png" alt="THE RIDERY WINGBOOST" style={{ maxWidth: '200px', marginBottom: '32px' }} />
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
                Un code à 6 chiffres a été envoyé à <strong>marketing@theridery.com</strong>.
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
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Valider</button>
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
