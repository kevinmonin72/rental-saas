'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../components/CsvImporterButton';
import { useStore } from '../lib/store';

export default function CustomersPage() {
  const [mounted, setMounted] = useState(false);
  const { customers, addCustomer, deleteCustomer } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
          <h2>Base Clients</h2>
          {customers.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun client enregistré.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customers.map(customer => (
                <div key={customer.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{customer.first_name} {customer.last_name}</h3>
                    <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                      {customer.email && <span style={{ marginRight: '16px' }}>✉️ {customer.email}</span>}
                      {customer.phone && <span>📞 {customer.phone}</span>}
                    </div>
                  </div>
                  <button onClick={() => deleteCustomer(customer.id)} className="btn btn-secondary" style={{ color: '#ef4444' }}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
