'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function PromoCodesPage() {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [maxUses, setMaxUses] = useState('');

  const fetchPromos = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('promo_codes').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Erreur chargement codes promo:', error);
    } else {
      setPromos(data || []);
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

    const { error } = await supabase.from('promo_codes').insert([promoData]);
    if (error) {
      alert(`Erreur création: ${error.message}`);
    } else {
      setCode('');
      setDiscountType('percentage');
      setDiscountValue('');
      setTargetEmail('');
      setMaxUses('');
      fetchPromos();
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    const { error } = await supabase.from('promo_codes').update({ is_active: !currentStatus }).eq('id', id);
    if (!error) {
      fetchPromos();
    }
  };

  const deletePromo = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce code promo ?')) return;
    const { error } = await supabase.from('promo_codes').delete().eq('id', id);
    if (!error) {
      fetchPromos();
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Codes Promo</h1>
        <p className="page-subtitle">Gérez vos codes de réduction pour le site de réservation.</p>
      </div>

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
                        <button 
                          onClick={() => deletePromo(p.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                        >
                          🗑️
                        </button>
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
