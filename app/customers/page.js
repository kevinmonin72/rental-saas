'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function CustomersPage() {
  const formatName = (f, l) => {
    const sf = (f === 'undefined' || f === 'null' || !f) ? '' : f;
    const sl = (l === 'undefined' || l === 'null' || !l) ? '' : l;
    return `${sf} ${sl}`.trim();
  };

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Form State
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const { customers, addCustomer, updateCustomer, deleteCustomer, bulkDeleteCustomers } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset pagination when search query or sort order changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOrder]);

  const filteredCustomers = customers.filter(c => {
    const term = searchQuery.toLowerCase();
    const fullName = formatName(c.first_name, c.last_name).toLowerCase();
    return fullName.includes(term) || 
           (c.email && c.email.toLowerCase().includes(term)) || 
           (c.phone && c.phone.includes(term));
  });

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    const strA = formatName(a.first_name, a.last_name).toLowerCase() || (a.email || '').toLowerCase() || 'zzz';
    const strB = formatName(b.first_name, b.last_name).toLowerCase() || (b.email || '').toLowerCase() || 'zzz';
    
    if (sortOrder === 'az') return strA.localeCompare(strB);
    return strB.localeCompare(strA);
  });

  // Paginated List
  const totalPages = Math.ceil(sortedCustomers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedCustomers = sortedCustomers.slice(startIndex, endIndex);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const customerData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null
    };

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, customerData);
      setEditingCustomer(null);
    } else {
      addCustomer(customerData);
    }

    // Reset Form
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFirstName(customer.first_name || '');
    setLastName(customer.last_name || '');
    setEmail(customer.email || '');
    setPhone(customer.phone || '');
  };

  const handleCancelEdit = () => {
    setEditingCustomer(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedCustomers.map(c => c.id));
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link 
            href="/settings" 
            style={{ 
              textDecoration: 'none', 
              fontSize: '20px', 
              color: 'var(--text-main)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              backgroundColor: 'white', 
              border: '1px solid var(--border-color)', 
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ←
          </Link>
          <h1 style={{ marginBottom: 0 }}>Gestion des Clients</h1>
        </div>
        <CsvImporterButton type="customers" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add / Edit Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>{editingCustomer ? 'Modifier le Client' : 'Nouveau Client'}</h2>
            {editingCustomer && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="btn btn-secondary" 
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                Annuler
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Prénom</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Nom</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input" 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input" 
              />
            </div>
            <div className="form-group">
              <label>Téléphone</label>
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input" 
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              {editingCustomer ? 'Mettre à jour' : 'Enregistrer'}
            </button>
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
              placeholder="Rechercher un client (nom, email, téléphone)..." 
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
                  Affichage de {startIndex + 1} à {Math.min(endIndex, sortedCustomers.length)} sur {sortedCustomers.length} clients
                </p>
                {selectedIds.length > 0 && (
                  <button 
                    onClick={handleBulkDelete} 
                    className="btn btn-secondary" 
                    style={{ color: 'white', backgroundColor: '#ef4444', border: 'none', padding: '6px 12px' }}
                  >
                    Supprimer les {selectedIds.length} sélectionnés
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 16px' }}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll} 
                  checked={selectedIds.length > 0 && selectedIds.length === paginatedCustomers.length}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Tout sélectionner (sur cette page)</span>
              </div>

              {paginatedCustomers.map(customer => (
                <div 
                  key={customer.id} 
                  className="card" 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px',
                    padding: '16px 24px',
                    borderColor: editingCustomer?.id === customer.id ? 'var(--primary-color)' : 'var(--border-color)',
                    backgroundColor: editingCustomer?.id === customer.id ? '#FFF7ED' : 'var(--surface-color)',
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(customer.id)}
                    onChange={() => toggleSelect(customer.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>
                      {formatName(customer.first_name, customer.last_name)}
                    </h3>
                    <div style={{ color: 'var(--text-light)', fontSize: '14px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      {customer.email && (
                        <span>
                          ✉️ <a href={`mailto:${customer.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{customer.email}</a>
                        </span>
                      )}
                      {customer.phone && (
                        <span>
                          📞 <a href={`tel:${customer.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{customer.phone}</a>
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleEdit(customer)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => { if (confirm('Supprimer ce client définitivement ?')) deleteCustomer(customer.id); }} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '13px', color: '#ef4444' }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '24px' }}>
                  <button 
                    onClick={() => setCurrentPage(1)} 
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    «
                  </button>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                    disabled={currentPage === 1}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    ‹
                  </button>
                  
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    Page <strong>{currentPage}</strong> sur <strong>{totalPages}</strong>
                  </span>
                  
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    ›
                  </button>
                  <button 
                    onClick={() => setCurrentPage(totalPages)} 
                    disabled={currentPage === totalPages}
                    className="btn btn-secondary"
                    style={{ padding: '6px 12px', opacity: currentPage === totalPages ? 0.5 : 1 }}
                  >
                    »
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
