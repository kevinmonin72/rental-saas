'use client';

import { useState } from 'react';
import { useStore } from '../lib/store';

export default function ShopifySyncButton({ type }) {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(new Date().toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = typeof window !== 'undefined' ? (sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token')) : null;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-Admin-Token'] = token;

      const res = await fetch('/api/sync/shopify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ type })
      });
      const data = await res.json();
      
      if (res.ok) {
        setLastSync(new Date().toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        }));
        // Re-fetch data if needed from global store
        const state = useStore.getState();
        if (state.fetchData) {
          await state.fetchData();
        }
      } else {
        alert("Erreur de synchronisation: " + data.error);
      }
    } catch (err) {
      alert("Erreur réseau lors de la synchronisation.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
        Dernière maj : {lastSync}
      </span>
      <button 
        onClick={handleSync}
        disabled={syncing}
        className="btn btn-secondary"
        style={{ 
          padding: '8px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          backgroundColor: 'white',
          cursor: syncing ? 'wait' : 'pointer'
        }}
        title={type === 'inventory' ? "Mettre à jour l'inventaire depuis Shopify" : "Mettre à jour les clients depuis Shopify"}
      >
        <svg 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          style={{ animation: syncing ? 'spin 1s linear infinite' : 'none', color: '#6B7280' }}
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
      </button>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
      `}</style>
    </div>
  );
}
