import { openDb } from '../../lib/db';
import { addEquipment } from '../actions';
import CsvImporterButton from '../../components/CsvImporterButton';

export default async function InventoryPage() {
  const db = await openDb();
  const equipmentList = await db.all('SELECT * FROM equipment ORDER BY id DESC');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Équipements</h1>
        <CsvImporterButton type="equipment" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Formulaire d'ajout */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Ajouter un équipement</h2>
          <form action={addEquipment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="name" style={{ fontWeight: 500, fontSize: '14px' }}>Nom</label>
              <input type="text" id="name" name="name" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="category" style={{ fontWeight: 500, fontSize: '14px' }}>Catégorie</label>
              <input type="text" id="category" name="category" placeholder="ex: Vélo, Ski..." required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="quantity" style={{ fontWeight: 500, fontSize: '14px' }}>Quantité totale</label>
              <input type="number" id="quantity" name="quantity" min="1" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Ajouter
            </button>
          </form>
        </div>

        {/* Liste des équipements */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Inventaire ({equipmentList.length})</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Nom</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Catégorie</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {equipmentList.map(eq => (
                <tr key={eq.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>#{eq.id}</td>
                  <td style={{ padding: '12px 0', fontWeight: 500 }}>{eq.name}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span style={{ backgroundColor: 'var(--bg-color)', padding: '4px 8px', borderRadius: '12px', fontSize: '13px', border: '1px solid var(--border-color)' }}>
                      {eq.category}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0', fontWeight: 600, color: 'var(--primary-color)' }}>{eq.total_quantity}</td>
                </tr>
              ))}
              {equipmentList.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun équipement pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
