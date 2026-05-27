'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false);
  const { equipment, addEquipment, deleteEquipment } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

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
                <option value="Wing">Wing</option>
                <option value="Board">Planche</option>
                <option value="Foil">Foil</option>
                <option value="Accessory">Accessoire</option>
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
          <h2>Inventaire Actuel</h2>
          {equipment.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun équipement enregistré.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {equipment.map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{item.name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge">{item.category}</span>
                      <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#475569', border: 'none' }}>Réf: {item.reference || 'N/A'}</span>
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
