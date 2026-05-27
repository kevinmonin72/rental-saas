'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function CustomersPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [selectedIds, setSelectedIds] = useState([]);
  const { customers, addCustomer, deleteCustomer, bulkDeleteCustomers } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredCustomers = customers.filter(c => {
    const term = searchQuery.toLowerCase();
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    return fullName.includes(term) || (c.email && c.email.toLowerCase().includes(term)) || (c.phone && c.phone.includes(term));
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const strA = (`${a.first_name || ''} ${a.last_name || ''}`).trim().toLowerCase() || (a.email || '').toLowerCase() || 'zzz';
    const strB = (`${b.first_name || ''} ${b.last_name || ''}`).trim().toLowerCase() || (b.email || '').toLowerCase() || 'zzz';
    
    if (sortOrder === 'az') return strA.localeCompare(strB);
    return strB.localeCompare(strA);
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addCustomer({
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      email: formData.get('email'),
      phone: formData.get('phone')
    });
    e.target.reset();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(sortedCustomers.slice(0, 50).map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer définitivement ${selectedIds.length} client(s) sélectionné(s) ?`)) {
      bulkDeleteCustomers(selectedIds);
      setSelectedIds([]);
    }
  };

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Clients</h1>
        <CsvImporterButton type="customers" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add Form */}
        <div className="card">
          <h2>Nouveau Client</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Prénom</label>
              <input type="text" name="first_name" className="input" required />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input type="text" name="last_name" className="input" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" className="input" />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input type="tel" name="phone" className="input" />
            </div>
            <button type="submit" className="btn btn-primary">Enregistrer</button>
          </form>
        </div>

        {/* List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Base Clients</h2>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="Rechercher un client..." 
              className="input" 
              style={{ flex: 1 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="input" 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              style={{ minWidth: '120px' }}
            >
              <option value="az">A à Z</option>
              <option value="za">Z à A</option>
            </select>
          </div>

          {sortedCustomers.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun client trouvé.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Affichage de {Math.min(50, sortedCustomers.length)} sur {sortedCustomers.length} clients
                </p>
                {selectedIds.length > 0 && (
                  <button onClick={handleBulkDelete} className="btn btn-secondary" style={{ color: 'white', backgroundColor: '#ef4444', border: 'none', padding: '6px 12px' }}>
                    Supprimer les {selectedIds.length} sélectionnés
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedIds.length > 0 && selectedIds.length === Math.min(50, sortedCustomers.length)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Tout sélectionner (sur cette page)</span>
              </div>

              {sortedCustomers.slice(0, 50).map(customer => (
                <div key={customer.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => toggleSelect(customer.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 8px 0' }}>
                      {customer.first_name || customer.last_name ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'Client Inconnu'}
                    </h3>
                    <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                      {customer.email && <span style={{ marginRight: '16px' }}>✉️ {customer.email}</span>}
                      {customer.phone && <span>📞 {customer.phone}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteCustomer(customer.id)} className="btn btn-secondary" style={{ color: '#ef4444' }}>Supprimer</button>
                </div>
              ))}
              {sortedCustomers.length > 50 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '8px' }}>
                  + {sortedCustomers.length - 50} autres clients. <br/>
                  <small>Utilisez la barre de recherche pour affiner les résultats.</small>
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
