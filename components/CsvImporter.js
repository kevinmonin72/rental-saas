'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import styles from './CsvImporter.module.css';

const SCHEMA = {
  equipment: {
    title: "Importer des Équipements",
    fields: [
      { key: 'name', label: "Nom de l'équipement (Requis)", required: true },
      { key: 'category', label: "Catégorie", required: false },
      { key: 'quantity', label: "Quantité", required: false }
    ]
  },
  customers: {
    title: "Importer des Clients",
    fields: [
      { key: 'first_name', label: "Prénom (Requis)", required: true },
      { key: 'last_name', label: "Nom (Requis)", required: true },
      { key: 'email', label: "Email", required: false },
      { key: 'phone', label: "Téléphone", required: false }
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
  const [previewData, setPreviewData] = useState([]);

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
          
          // Auto-map if headers match exactly or closely
          const initialMapping = {};
          schema.fields.forEach(f => {
            const match = results.meta.fields.find(
              h => h.toLowerCase() === f.key.toLowerCase() || h.toLowerCase() === f.label.toLowerCase()
            );
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
      if (f.required && !mapping[f.key]) {
        alert(`La colonne "${f.label}" est obligatoire.`);
        return;
      }
    }

    const mapped = csvData.map(row => {
      const newRow = {};
      schema.fields.forEach(f => {
        if (mapping[f.key]) {
          newRow[f.key] = row[mapping[f.key]];
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
              <p style={{ marginBottom: '24px' }}>Faites correspondre les colonnes de votre fichier aux champs attendus.</p>
              {schema.fields.map(f => (
                <div key={f.key} className={styles.mappingRow}>
                  <div style={{ fontWeight: 500, width: '40%' }}>{f.label}</div>
                  <div style={{ width: '60%' }}>
                    <select 
                      className="input" 
                      value={mapping[f.key] || ''}
                      onChange={(e) => setMapping({...mapping, [f.key]: e.target.value})}
                    >
                      <option value="">-- Ignorer ce champ --</option>
                      {csvHeaders.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
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
