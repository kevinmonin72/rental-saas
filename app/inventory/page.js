'use client';

import { useState, useEffect } from 'react';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [selectedIds, setSelectedIds] = useState([]);
  const { equipment, addEquipment, deleteEquipment, bulkDeleteEquipment } = useStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredEquipment = equipment.filter(e => {
    const term = searchQuery.toLowerCase();
    const searchStr = `${e.name || ''} ${e.reference || ''} ${e.category || ''} ${e.brand || ''}`.toLowerCase();
    return searchStr.includes(term);
  });

  const sortedEquipment = [...filteredEquipment].sort((a, b) => {
    const strA = (`${a.name || ''} ${a.reference || ''}`).toLowerCase();
    const strB = (`${b.name || ''} ${b.reference || ''}`).toLowerCase();
    
    if (sortOrder === 'az') return strA.localeCompare(strB);
    return strB.localeCompare(strA);
  });

  const handleAdd = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    addEquipment({
      name: formData.get('name'),
      reference: formData.get('reference'),
      category: formData.get('category'),
      brand: formData.get('brand'),
      condition: formData.get('condition')
    });
    e.target.reset();
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(sortedEquipment.slice(0, 50).map(eq => eq.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Supprimer définitivement ${selectedIds.length} équipement(s) sélectionné(s) ?`)) {
      bulkDeleteEquipment(selectedIds);
      setSelectedIds([]);
    }
  };

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion de l'Inventaire</h1>
        <CsvImporterButton type="equipment" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add Form */}
        <div className="card">
          <h2>Nouvel Équipement</h2>
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label>Nom du modèle</label>
              <input type="text" name="name" className="input" required />
            </div>
            <div className="form-group">
              <label>Référence / SKU</label>
              <input type="text" name="reference" className="input" />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="category" className="input" required>
                <option value="Planches">Planches</option>
                <option value="Combinaisons">Combinaisons</option>
                <option value="Harnais">Harnais</option>
                <option value="Accessoires">Accessoires</option>
                <option value="Autre">Autre</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marque</label>
              <input type="text" name="brand" className="input" />
            </div>
            <div className="form-group">
              <label>État</label>
              <select name="condition" className="input" required>
                <option value="Neuf">Neuf</option>
                <option value="Très bon">Très bon</option>
                <option value="Bon">Bon</option>
                <option value="Usagé">Usagé</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Ajouter à l'inventaire</button>
          </form>
        </div>

        {/* List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Stock Actuel</h2>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <input 
              type="text" 
              placeholder="Rechercher un équipement..." 
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

          {sortedEquipment.length === 0 ? (
            <p style={{ color: 'var(--text-light)' }}>Aucun équipement trouvé.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                  Affichage de {Math.min(50, sortedEquipment.length)} sur {sortedEquipment.length} équipements
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
                  checked={selectedIds.length > 0 && selectedIds.length === Math.min(50, sortedEquipment.length)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Tout sélectionner (sur cette page)</span>
              </div>

              {sortedEquipment.slice(0, 50).map(item => (
                <div key={item.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggleSelect(item.id)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      <span className="badge">{item.category}</span>
                    </div>
                    <div style={{ color: 'var(--text-light)', fontSize: '14px', display: 'flex', gap: '16px' }}>
                      <span><strong>Réf:</strong> {item.reference || 'N/A'}</span>
                      <span><strong>Marque:</strong> {item.brand || 'N/A'}</span>
                      <span><strong>État:</strong> {item.condition}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteEquipment(item.id)} className="btn btn-secondary" style={{ color: '#ef4444' }}>Supprimer</button>
                </div>
              ))}
              {sortedEquipment.length > 50 && (
                <p style={{ textAlign: 'center', color: 'var(--text-light)', marginTop: '8px' }}>
                  + {sortedEquipment.length - 50} autres équipements. <br/>
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
