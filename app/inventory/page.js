'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import CsvImporterButton from '../../components/CsvImporterButton';
import { useStore } from '../../lib/store';

export default function InventoryPage() {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('az');
  const [selectedIds, setSelectedIds] = useState([]);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const { equipment, addEquipment, updateEquipment, deleteEquipment, bulkDeleteEquipment } = useStore();
  const editingEquipment = editingEquipmentId ? equipment.find(e => e.id === editingEquipmentId) : null;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const eqData = {
      name: formData.get('name'),
      reference: formData.get('reference'),
      category: formData.get('category'),
      brand: formData.get('brand'),
      condition: formData.get('condition'),
      quantity: parseInt(formData.get('quantity'), 10) || 1
    };

    if (editingEquipmentId) {
      updateEquipment(editingEquipmentId, eqData);
      setEditingEquipmentId(null);
    } else {
      addEquipment(eqData);
    }
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
          <h1 style={{ marginBottom: 0 }}>Gestion de l'Inventaire</h1>
        </div>
        <CsvImporterButton type="equipment" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Add Form */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>{editingEquipmentId ? 'Modifier Équipement' : 'Nouvel Équipement'}</h2>
            {editingEquipmentId && (
              <button onClick={() => setEditingEquipmentId(null)} className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                Annuler
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} key={editingEquipmentId || 'new'}>
            <div className="form-group">
              <label>Nom du modèle</label>
              <input type="text" name="name" className="input" defaultValue={editingEquipment?.name || ''} required />
            </div>
            <div className="form-group">
              <label>Référence / SKU</label>
              <input type="text" name="reference" className="input" defaultValue={editingEquipment?.reference || ''} />
            </div>
            <div className="form-group">
              <label>Catégorie</label>
              <select name="category" className="input" defaultValue={editingEquipment?.category || 'Aile'} required>
                <option value="Aile">Aile</option>
                <option value="Planche">Planche</option>
                <option value="Foil">Foil</option>
                <option value="Mât">Mât</option>
                <option value="Platine">Platine</option>
                <option value="Accessoire">Accessoire</option>
              </select>
            </div>
            <div className="form-group">
              <label>Marque</label>
              <input type="text" name="brand" className="input" defaultValue={editingEquipment?.brand || ''} />
            </div>
            <div className="form-group">
              <label>Quantité en stock</label>
              <input type="number" name="quantity" className="input" defaultValue={editingEquipment?.quantity || 1} min="1" required />
            </div>
            <button type="submit" className="btn btn-primary">
              {editingEquipmentId ? 'Enregistrer les modifications' : "Ajouter à l'inventaire"}
            </button>
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
                      <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}><strong>Stock:</strong> {item.quantity || 1}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button onClick={() => setEditingEquipmentId(item.id)} className="btn btn-secondary">Éditer</button>
                    <button onClick={() => deleteEquipment(item.id)} className="btn btn-secondary" style={{ color: '#ef4444' }}>Supprimer</button>
                  </div>
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
