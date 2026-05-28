'use client';

import { useState } from 'react';
import CsvImporter from './CsvImporter';
import { useStore } from '../lib/store';

export default function CsvImporterButton({ type }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conflicts, setConflicts] = useState(null); // { conflicts: [...], noConflict: [...] }
  const [conflictActions, setConflictActions] = useState({}); // { index: 'add_stock' | 'create_new' | 'skip' }
  const { bulkImportEquipment, bulkImportCustomers, bulkImportBookings, resolveEquipmentConflicts, equipment } = useStore();

  const handleImport = (data) => {
    if (type === 'equipment') {
      // Group imported items by reference to detect internal CSV duplicates
      const refGroups = {};
      data.forEach(item => {
        const ref = (item.reference || '').trim();
        if (ref) {
          if (!refGroups[ref]) refGroups[ref] = [];
          refGroups[ref].push(item);
        }
      });

      // Merge internal CSV duplicates: keep the first, sum quantities
      const mergedData = [];
      const seen = {};
      data.forEach(item => {
        const ref = (item.reference || '').trim();
        if (ref && refGroups[ref] && refGroups[ref].length > 1) {
          if (!seen[ref]) {
            seen[ref] = true;
            const merged = { ...refGroups[ref][0] };
            merged.quantity = refGroups[ref].reduce((sum, i) => sum + (parseInt(i.quantity, 10) || 1), 0);
            mergedData.push(merged);
          }
        } else {
          mergedData.push(item);
        }
      });

      // Now check for conflicts with existing equipment
      const conflicting = [];
      const noConflict = [];
      mergedData.forEach(item => {
        const ref = (item.reference || '').trim();
        if (!ref) {
          noConflict.push(item);
          return;
        }
        const existing = equipment.find(e => (e.reference || '').trim().toLowerCase() === ref.toLowerCase());
        if (existing) {
          conflicting.push({ importedItem: item, existingItem: existing });
        } else {
          noConflict.push(item);
        }
      });

      if (conflicting.length > 0) {
        // Show conflict resolution modal
        const initialActions = {};
        conflicting.forEach((_, i) => { initialActions[i] = 'add_stock'; });
        setConflictActions(initialActions);
        setConflicts({ conflicts: conflicting, noConflict });
        setIsOpen(false);
      } else {
        // No conflicts, import directly
        bulkImportEquipment(mergedData);
        setIsOpen(false);
      }
    } else if (type === 'customers') {
      bulkImportCustomers(data);
      setIsOpen(false);
    } else if (type === 'bookings') {
      bulkImportBookings(data);
      setIsOpen(false);
    }
  };

  const handleResolveConflicts = async () => {
    const { conflicts: conflictList, noConflict } = conflicts;

    // Import non-conflicting items first
    if (noConflict.length > 0) {
      await bulkImportEquipment(noConflict);
    }

    // Resolve conflicts
    const actions = conflictList.map((c, i) => ({
      action: conflictActions[i],
      importedItem: c.importedItem,
      existingItem: c.existingItem
    }));

    await resolveEquipmentConflicts(actions);
    setConflicts(null);
    setConflictActions({});
  };

  return (
    <>
      <button 
        className="btn btn-secondary" 
        onClick={() => setIsOpen(true)}
      >
        Importer depuis CSV
      </button>

      {isOpen && (
        <CsvImporter 
          type={type} 
          onClose={() => setIsOpen(false)} 
          onImport={handleImport} 
        />
      )}

      {conflicts && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001
        }}>
          <div style={{
            backgroundColor: 'var(--surface-color, #fff)', borderRadius: '16px', padding: '32px',
            maxWidth: '800px', width: '95%', maxHeight: '85vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚠️ Références identiques détectées !
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '14px' }}>
              {conflicts.conflicts.length} équipement(s) ont une référence identique à un produit déjà existant. 
              Choisissez l'action à effectuer pour chacun.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {conflicts.conflicts.map((c, i) => (
                <div key={i} style={{
                  border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '12px',
                  padding: '16px', backgroundColor: '#FFFBEB'
                }}>
                  <div style={{ display: 'flex', gap: '24px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Déjà en base
                      </div>
                      <div style={{ fontWeight: 600 }}>{c.existingItem.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                        Réf: {c.existingItem.reference} — Stock actuel: {c.existingItem.quantity || 1}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#D97706', fontWeight: 'bold', fontSize: '20px' }}>
                      VS
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Import CSV
                      </div>
                      <div style={{ fontWeight: 600 }}>{c.importedItem.name}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                        Réf: {c.importedItem.reference} — Qté: {c.importedItem.quantity || 1}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setConflictActions({ ...conflictActions, [i]: 'add_stock' })}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                        borderColor: conflictActions[i] === 'add_stock' ? '#16A34A' : 'var(--border-color, #e5e7eb)',
                        backgroundColor: conflictActions[i] === 'add_stock' ? '#DCFCE7' : 'transparent',
                        color: conflictActions[i] === 'add_stock' ? '#15803D' : 'var(--text-main)',
                        cursor: 'pointer', fontWeight: conflictActions[i] === 'add_stock' ? 600 : 400, fontSize: '13px'
                      }}
                    >
                      📦 Ajouter au stock existant (+{c.importedItem.quantity || 1})
                    </button>
                    <button
                      onClick={() => setConflictActions({ ...conflictActions, [i]: 'create_new' })}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                        borderColor: conflictActions[i] === 'create_new' ? '#2563EB' : 'var(--border-color, #e5e7eb)',
                        backgroundColor: conflictActions[i] === 'create_new' ? '#DBEAFE' : 'transparent',
                        color: conflictActions[i] === 'create_new' ? '#1E40AF' : 'var(--text-main)',
                        cursor: 'pointer', fontWeight: conflictActions[i] === 'create_new' ? 600 : 400, fontSize: '13px'
                      }}
                    >
                      ➕ Créer comme nouveau produit
                    </button>
                    <button
                      onClick={() => setConflictActions({ ...conflictActions, [i]: 'skip' })}
                      style={{
                        padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                        borderColor: conflictActions[i] === 'skip' ? '#ef4444' : 'var(--border-color, #e5e7eb)',
                        backgroundColor: conflictActions[i] === 'skip' ? '#FEE2E2' : 'transparent',
                        color: conflictActions[i] === 'skip' ? '#DC2626' : 'var(--text-main)',
                        cursor: 'pointer', fontWeight: conflictActions[i] === 'skip' ? 600 : 400, fontSize: '13px'
                      }}
                    >
                      🗑️ Ignorer
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {conflicts.noConflict.length > 0 && (
              <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-light)' }}>
                ✅ {conflicts.noConflict.length} autre(s) équipement(s) sans conflit seront importés normalement.
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => { setConflicts(null); setConflictActions({}); }}
              >
                Annuler
              </button>
              <button className="btn btn-primary" onClick={handleResolveConflicts}>
                Appliquer et importer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
