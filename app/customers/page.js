import { openDb } from '../../lib/db';
import { addCustomer } from '../actions';
import CsvImporterButton from '../../components/CsvImporterButton';

export default async function CustomersPage() {
  const db = await openDb();
  const customerList = await db.all('SELECT * FROM customers ORDER BY id DESC');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ marginBottom: 0 }}>Gestion des Clients</h1>
        <CsvImporterButton type="customers" />
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
        
        {/* Formulaire d'ajout */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Ajouter un client</h2>
          <form action={addCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="firstName" style={{ fontWeight: 500, fontSize: '14px' }}>Prénom</label>
              <input type="text" id="firstName" name="firstName" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="lastName" style={{ fontWeight: 500, fontSize: '14px' }}>Nom</label>
              <input type="text" id="lastName" name="lastName" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="email" style={{ fontWeight: 500, fontSize: '14px' }}>Email</label>
              <input type="email" id="email" name="email" required style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label htmlFor="phone" style={{ fontWeight: 500, fontSize: '14px' }}>Téléphone (optionnel)</label>
              <input type="tel" id="phone" name="phone" style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} />
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
              Ajouter
            </button>
          </form>
        </div>

        {/* Liste des clients */}
        <div className="card">
          <h2 style={{ marginBottom: '16px', fontSize: '18px' }}>Base Clients ({customerList.length})</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>ID</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Nom complet</th>
                <th style={{ padding: '12px 0', color: 'var(--text-muted)', fontWeight: 500 }}>Contact</th>
              </tr>
            </thead>
            <tbody>
              {customerList.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '12px 0', color: 'var(--text-muted)' }}>#{c.id}</td>
                  <td style={{ padding: '12px 0', fontWeight: 500 }}>{c.first_name} {c.last_name}</td>
                  <td style={{ padding: '12px 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                    <div>{c.email}</div>
                    {c.phone && <div>{c.phone}</div>}
                  </td>
                </tr>
              ))}
              {customerList.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Aucun client pour le moment.
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
