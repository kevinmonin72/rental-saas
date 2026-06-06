'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PromoCodesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingPromoId, setSendingPromoId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: null, confirmText: 'Confirmer', confirmStyle: 'primary' });

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPromos(data || []);
    } catch (error) {
      console.error('Erreur chargement codes promo:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim() || !discountValue) return;

    const promoData = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: parseFloat(discountValue),
      target_email: targetEmail.trim() || null,
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      is_active: true
    };

    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promoData)
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Erreur création: ${err.error}`);
      } else {
        setCode('');
        setDiscountType('percentage');
        setDiscountValue('');
        setTargetEmail('');
        setMaxUses('');
        fetchPromos();
      }
    } catch (err) {
      alert(`Erreur serveur: ${err.message}`);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const res = await fetch('/api/promos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !currentStatus })
      });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const openDeleteConfirm = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Supprimer le code promo',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement ce code promo ? Cette action est irréversible.',
      action: () => executeDelete(id),
      confirmText: 'Supprimer',
      confirmStyle: 'danger'
    });
  };

  const executeDelete = async (id) => {
    try {
      const res = await fetch(`/api/promos?id=${id}`, { method: 'DELETE' });
      if (res.ok) fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const openSendConfirm = (promo) => {
    if (!promo.target_email) return;
    setConfirmModal({
      isOpen: true,
      title: 'Envoyer le code promo',
      message: `Voulez-vous déclencher l'envoi du code promo ${promo.code} à ${promo.target_email} via Klaviyo ?`,
      action: () => executeSend(promo),
      confirmText: 'Envoyer',
      confirmStyle: 'primary'
    });
  };

  const executeSend = async (promo) => {
    try {
      const res = await fetch('/api/promos/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur d'envoi: ${data.error}`);
      } else {
        alert('Email envoyé avec succès !');
      }
    } catch (err) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setSendingPromoId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Codes Promo</h1>
        <p className="page-subtitle">Gérez vos codes de réduction pour le site de réservation.</p>
      </div>

      {/* Modal de confirmation */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)', animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', animation: 'slideUp 0.3s ease-out' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px 0', color: '#4B5563', fontSize: '14px', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #D1D5DB', backgroundColor: 'white', color: '#374151', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.15s' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
              >
                Annuler
              </button>
              <button 
                onClick={() => {
                  confirmModal.action();
                  setConfirmModal({ ...confirmModal, isOpen: false });
                }}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  backgroundColor: confirmModal.confirmStyle === 'danger' ? '#EF4444' : '#F97316', 
                  color: 'white', 
                  cursor: 'pointer', 
                  fontWeight: '500',
                  transition: 'opacity 0.15s'
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          `}} />
        </div>
      )}

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div className="card" style={{ flex: '1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Liste des codes</h2>
            <input 
              type="text" 
              className="input" 
              placeholder="Rechercher (code, email)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px', margin: 0 }}
            />
          </div>
          {loading ? (
            <p>Chargement...</p>
          ) : promos.length === 0 ? (
            <p className="empty-state">Aucun code promo créé.</p>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Valeur</th>
                    <th>Email ciblé</th>
                    <th>Utilisations</th>
                    <th>Statut</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {promos.filter(p => {
                    const q = searchQuery.toLowerCase();
                    return p.code.toLowerCase().includes(q) || (p.target_email && p.target_email.toLowerCase().includes(q));
                  }).map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{p.code}</td>
                      <td>{p.discount_type === 'percentage' ? `${p.discount_value}%` : `${p.discount_value} €`}</td>
                      <td>{p.target_email || <span style={{color:'#9ca3af'}}>Tous</span>}</td>
                      <td>{p.used_count} / {p.max_uses ? p.max_uses : '∞'}</td>
                      <td>
                        <button 
                          onClick={() => toggleStatus(p.id, p.is_active)}
                          style={{
                            background: p.is_active ? '#dcfce7' : '#fee2e2',
                            color: p.is_active ? '#166534' : '#991b1b',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          {p.is_active ? 'Actif' : 'Inactif'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', height: '100%' }}>
                          {p.target_email && (
                            <button 
                              onClick={() => openSendConfirm(p)}
                              disabled={sendingPromoId === p.id}
                              style={{ 
                                background: 'none', border: 'none', cursor: 'pointer', 
                                fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: sendingPromoId === p.id ? 0.5 : 1, padding: 0 
                              }}
                              title="Envoyer par email"
                            >
                              {sendingPromoId === p.id ? '⏳' : '✉️'}
                            </button>
                          )}
                          <button 
                            onClick={() => openDeleteConfirm(p.id)}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer', 
                              fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0 
                            }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ width: '360px', alignSelf: 'flex-start', position: 'sticky', top: '24px' }}>
          <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Créer un code</h2>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Code Promo</label>
              <input 
                type="text" 
                className="input" 
                placeholder="Ex: WELCOME10" 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Type de réduction</label>
              <select className="input" value={discountType} onChange={e => setDiscountType(e.target.value)}>
                <option value="percentage">Pourcentage (%)</option>
                <option value="amount">Montant fixe (€)</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Valeur de la réduction</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="input" 
                placeholder={discountType === 'percentage' ? "Ex: 10" : "Ex: 15.50"} 
                value={discountValue} 
                onChange={e => setDiscountValue(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Email ciblé <span style={{color: '#9CA3AF', fontWeight: 'normal'}}>(Optionnel)</span></label>
              <input 
                type="email" 
                className="input" 
                placeholder="Si vide, valable pour tous" 
                value={targetEmail} 
                onChange={e => setTargetEmail(e.target.value)}
              />
              <span style={{fontSize:'12px', color:'#6b7280', marginTop: '6px'}}>Ce code ne fonctionnera que pour cet email.</span>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre d'utilisations <span style={{color: '#9CA3AF', fontWeight: 'normal'}}>(Optionnel)</span></label>
              <input 
                type="number" 
                min="1"
                className="input" 
                placeholder="Ex: 50" 
                value={maxUses} 
                onChange={e => setMaxUses(e.target.value)}
              />
              <span style={{fontSize:'12px', color:'#6b7280'}}>Laissez vide pour un usage illimité.</span>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Créer le code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
