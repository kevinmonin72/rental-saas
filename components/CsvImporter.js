'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import styles from './CsvImporter.module.css';

const SCHEMA = {
  equipment: {
    title: "Importer des Équipements",
    fields: [
      { key: 'name', label: "Nom de l'équipement (Requis)", required: true, aliases: ['title', 'nom', 'product', 'titre'] },
      { key: 'reference', label: "Référence / N° de série", required: false, aliases: ['sku', 'variant sku', 'référence', 'ref', 'reference'] },
      { key: 'category', label: "Catégorie", required: false, aliases: ['product category', 'type', 'catégorie', 'product type', 'categorie'] },
      { key: 'collection', label: "Collection (Shopify)", required: false, aliases: ['collection', 'collections'] },
      { key: 'location', label: "Emplacement", required: false, aliases: ['location', 'emplacement', 'stock location'] },
      { key: 'quantity', label: "Quantité", required: false, aliases: ['variant inventory qty', 'qty', 'quantité', 'stock', 'inventory', 'quantite', 'wingboost marseille'] }
    ]
  },
  customers: {
    title: "Importer des Clients",
    fields: [
      { key: 'first_name', label: "Prénom (Requis)", required: true, aliases: ['first name', 'prénom', 'prenom', 'firstname'] },
      { key: 'last_name', label: "Nom (Requis)", required: true, aliases: ['last name', 'nom', 'lastname'] },
      { key: 'email', label: "Email", required: false, aliases: ['e-mail', 'courriel', 'email address'] },
      { key: 'phone', label: "Téléphone", required: false, aliases: ['téléphone', 'tel', 'telephone', 'mobile', 'phone number'] }
    ]
  },
  bookings: {
    title: "Importer des Réservations",
    fields: [
      { key: 'customer_id', label: "ID du Client (Requis)", required: true },
      { key: 'equipment_id', label: "ID de l'équipement (Requis)", required: true },
      { key: 'start_date', label: "Date de début (YYYY-MM-DD)", required: true },
      { key: 'end_date', label: "Date de fin (YYYY-MM-DD)", required: true },
      { key: 'quantity', label: "Quantité", required: true }
    ]
  }
};

export default function CsvImporter({ type, onClose, onImport }) {
  const schema = SCHEMA[type];
  const [step, setStep] = useState(1);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [mapping, setMapping] = useState({}); // { schemaKey: csvHeaderName }
  const [defaults, setDefaults] = useState({}); // { schemaKey: defaultValue }
  const [previewData, setPreviewData] = useState([]);

  const CATEGORY_OPTIONS = [
    "Ailes", "Planche", "Foil", "Mât avion", 
    "Aile avant", "Stab", "Platines", "Fuselage", "Accessoire"
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields && results.data.length > 0) {
          setCsvHeaders(results.meta.fields);
          setCsvData(results.data);
          
          const initialMapping = {};
          schema.fields.forEach(f => {
            const match = results.meta.fields.find(h => {
              const header = h.toLowerCase().trim();
              return header === f.key.toLowerCase() || 
                     header === f.label.toLowerCase() ||
                     (f.aliases && f.aliases.some(alias => header === alias));
            });
            if (match) initialMapping[f.key] = match;
          });
          setMapping(initialMapping);
          setStep(2);
        } else {
          alert("Le fichier semble vide ou mal formaté.");
        }
      }
    });
  };

  const generatePreview = () => {
    // Validate required mappings
    for (const f of schema.fields) {
      if (f.required && !mapping[f.key] && !defaults[f.key]) {
        alert(`La colonne "${f.label}" est obligatoire (choisissez une colonne CSV ou une valeur fixe).`);
        return;
      }
    }

    const mapped = csvData.map(row => {
      const newRow = {};
      schema.fields.forEach(f => {
        if (mapping[f.key] && row[mapping[f.key]]) {
          newRow[f.key] = row[mapping[f.key]];
        } else if (defaults[f.key]) {
          newRow[f.key] = defaults[f.key];
        } else {
          newRow[f.key] = '';
        }
      });
      return newRow;
    });

    setPreviewData(mapped);
    setStep(3);
  };

  const removeRow = (index) => {
    setPreviewData(previewData.filter((_, i) => i !== index));
  };

  const handleImport = () => {
    onImport(previewData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{schema.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <div>
              <p style={{ marginBottom: '16px' }}>Sélectionnez un fichier .csv à importer.</p>
              <label className={styles.uploadZone}>
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
                <span style={{ fontWeight: 600 }}>Cliquer pour parcourir</span> ou glisser-déposer ici.
              </label>
            </div>
          )}

          {step === 2 && (
            <div>
              <p style={{ marginBottom: '24px' }}>Faites correspondre les colonnes de votre fichier aux champs, <strong>ou choisissez une valeur fixe</strong> qui s'appliquera à toutes les lignes importées.</p>
              
              <div style={{ display: 'flex', fontWeight: 600, paddingBottom: '8px', borderBottom: '2px solid var(--border-color)', marginBottom: '8px' }}>
                <div style={{ width: '30%' }}>Champ attendu</div>
                <div style={{ width: '35%' }}>Colonne du CSV</div>
                <div style={{ width: '35%', paddingLeft: '12px' }}>OU Valeur fixe</div>
              </div>

              {schema.fields.map(f => (
                <div key={f.key} className={styles.mappingRow}>
                  <div style={{ fontWeight: 500, width: '30%' }}>{f.label}</div>
                  <div style={{ width: '35%' }}>
                    <select 
                      className="input" 
                      value={mapping[f.key] || ''}
                      onChange={(e) => setMapping({...mapping, [f.key]: e.target.value})}
                      style={{ marginBottom: 0 }}
                    >
                      <option value="">-- Ignorer --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ width: '35%', paddingLeft: '12px' }}>
                    {f.key === 'category' ? (
                      <select
                        className="input"
                        value={defaults[f.key] || ''}
                        onChange={(e) => setDefaults({...defaults, [f.key]: e.target.value})}
                        disabled={!!mapping[f.key]}
                        style={{ marginBottom: 0, opacity: mapping[f.key] ? 0.5 : 1 }}
                      >
                        <option value="">-- Aucune --</option>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        className="input" 
                        placeholder="Ex: 1, Paris..." 
                        value={defaults[f.key] || ''}
                        onChange={(e) => setDefaults({...defaults, [f.key]: e.target.value})}
                        disabled={!!mapping[f.key]}
                        style={{ marginBottom: 0, opacity: mapping[f.key] ? 0.5 : 1 }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div>
              <p style={{ marginBottom: '16px' }}>Vérifiez les données avant l'import final. Vous pouvez supprimer les lignes invalides.</p>
              <div style={{ overflowX: 'auto' }}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {schema.fields.map(f => <th key={f.key}>{f.label}</th>)}
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, idx) => (
                      <tr key={idx}>
                        {schema.fields.map(f => <td key={f.key}>{row[f.key]}</td>)}
                        <td>
                          <button className={styles.deleteRowBtn} onClick={() => removeRow(idx)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className="btn btn-secondary" onClick={onClose}>Annuler</button>
          {step === 2 && <button className="btn btn-primary" onClick={generatePreview}>Suivant (Aperçu)</button>}
          {step === 3 && <button className="btn btn-primary" onClick={handleImport}>Importer ({previewData.length} lignes)</button>}
        </div>
      </div>
    </div>
  );
}
