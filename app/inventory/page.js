'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false);
  const { equipment, addEquipment, deleteEquipment } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('az');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEquipment = equipment
    .filter(e => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (e.name?.toLowerCase().includes(term) || e.reference?.toLowerCase().includes(term) || e.category?.toLowerCase().includes(term));
    })
    .sort((a, b) => {
      const nameA = a.name?.toLowerCase() || '';
      const nameB = b.name?.toLowerCase() || '';
      if (sortOrder === 'az') return nameA.localeCompare(nameB);
      if (sortOrder === 'za') return nameB.localeCompare(nameA);
      return 0;
    });

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addEquipment({
      name: formData.get('name'),
      category: formData.get('category'),
      reference: formData.get('reference')
    });
    e.target.reset();
  };

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Équipements</h1>
        <CsvImporterButton type="equipment" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add Form */}
        <div className="card">
          <h2>Ajouter du matériel</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Nom de l'équipement</label>
              <input type="text" name="name" className="input" required />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="category" className="input">
                <option value="Ailes">Ailes</option>
                <option value="Planche">Planche</option>
                <option value="Foil">Foil</option>
                <option value="Mât avion">Mât avion</option>
                <option value="Aile avant">Aile avant</option>
                <option value="Stab">Stab</option>
                <option value="Platines">Platines</option>
                <option value="Fuselage">Fuselage</option>
                <option value="Accessoire">Accessoire</option>
              </select>
            </div>
            <div className="form-group">
              <label>Référence (ex: Numéro de série)</label>
              <input type="text" name="reference" className="input" placeholder="ex: WING-001" required />
            </div>
            <button type="submit" className="btn btn-primary">Ajouter</button>
          </form>
        </div>

        {/* List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Inventaire Actuel</h2>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="input" 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{ width: '120px', margin: 0 }}
              >
                <option value="az">A à Z</option>
                <option value="za">Z à A</option>
              </select>
              <input
                type="text"
                className="input"
                placeholder="Rechercher (nom, réf, catégorie)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '250px', margin: 0 }}
              />
            </div>
          </div>
          {filteredEquipment.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun équipement trouvé.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredEquipment.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge">{item.category}</span>
                      {item.collection && (
                        <span className="badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', border: 'none' }}>🛍 {item.collection}</span>
                      )}
                      <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#475569', border: 'none' }}>Réf: {item.reference || 'N/A'}</span>
                      {item.location && (
                        <span className="badge" style={{ backgroundColor: '#FEF3C7', color: '#92400E', border: 'none' }}>📍 {item.location}</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => deleteEquipment(item.id)} className="btn btn-secondary" style={{ color: '#ef4444' }}>Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
