'use client';

import { useState, useEffect } from 'react';
import CsvImporter from './CsvImporter';
import { useStore } from '../lib/store';

export default function CsvImporterButton({ type }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conflicts, setConflicts] = useState(null); // { conflicts: [...], noConflict: [...] }
  const [conflictActions, setConflictActions] = useState({}); // { index: 'add_stock' | 'create_new' | 'skip' | 'update_existing' }
  const [lastImportDate, setLastImportDate] = useState(null);

  useEffect(() => {
    const savedDate = localStorage.getItem(`last_csv_import_${type}`);
    if (savedDate) setLastImportDate(savedDate);
  }, [type]);
  const { 
    bulkImportEquipment, 
    bulkImportCustomers, 
    bulkImportBookings, 
    resolveEquipmentConflicts, 
    resolveCustomerConflicts,
    equipment, 
    customers 
  } = useStore();

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
        const now = new Date().toISOString();
        localStorage.setItem(`last_csv_import_${type}`, now);
        setLastImportDate(now);
        setIsOpen(false);
      }
    } else if (type === 'customers') {
      // Group imported customers by email (or name if no email) to detect internal CSV duplicates
      const emailGroups = {};
      const nameGroups = {};
      
      data.forEach(item => {
        const email = (item.email || '').trim().toLowerCase();
        const first = (item.first_name || '').trim().toLowerCase();
        const last = (item.last_name || '').trim().toLowerCase();
        const fullName = `${first}_${last}`;

        if (email) {
          if (!emailGroups[email]) emailGroups[email] = [];
          emailGroups[email].push(item);
        } else if (first && last) {
          if (!nameGroups[fullName]) nameGroups[fullName] = [];
          nameGroups[fullName].push(item);
        }
      });

      // Merge internal CSV duplicates
      const mergedData = [];
      const seenEmail = {};
      const seenName = {};

      data.forEach(item => {
        const email = (item.email || '').trim().toLowerCase();
        const first = (item.first_name || '').trim().toLowerCase();
        const last = (item.last_name || '').trim().toLowerCase();
        const fullName = `${first}_${last}`;

        if (email) {
          if (emailGroups[email].length > 1) {
            if (!seenEmail[email]) {
              seenEmail[email] = true;
              const merged = { ...emailGroups[email][0] };
              emailGroups[email].forEach(dup => {
                if (!merged.phone && dup.phone) merged.phone = dup.phone;
                if (!merged.first_name && dup.first_name) merged.first_name = dup.first_name;
                if (!merged.last_name && dup.last_name) merged.last_name = dup.last_name;
              });
              mergedData.push(merged);
            }
          } else {
            mergedData.push(item);
          }
        } else if (first && last) {
          if (nameGroups[fullName].length > 1) {
            if (!seenName[fullName]) {
              seenName[fullName] = true;
              const merged = { ...nameGroups[fullName][0] };
              nameGroups[fullName].forEach(dup => {
                if (!merged.phone && dup.phone) merged.phone = dup.phone;
                if (!merged.email && dup.email) merged.email = dup.email;
              });
              mergedData.push(merged);
            }
          } else {
            mergedData.push(item);
          }
        } else {
          mergedData.push(item);
        }
      });

      // Now check conflicts with existing customers in database
      const conflicting = [];
      const noConflict = [];

      mergedData.forEach(item => {
        const email = (item.email || '').trim().toLowerCase();
        const first = (item.first_name || '').trim().toLowerCase();
        const last = (item.last_name || '').trim().toLowerCase();

        const existing = customers.find(c => {
          const cEmail = (c.email || '').trim().toLowerCase();
          const cFirst = (c.first_name || '').trim().toLowerCase();
          const cLast = (c.last_name || '').trim().toLowerCase();

          const emailMatch = email && cEmail && email === cEmail;
          const nameMatch = first && last && cFirst && cLast && first === cFirst && last === cLast;

          return emailMatch || nameMatch;
        });

        if (existing) {
          conflicting.push({ importedItem: item, existingItem: existing });
        } else {
          noConflict.push(item);
        }
      });

      if (conflicting.length > 0) {
        const initialActions = {};
        conflicting.forEach((_, i) => { initialActions[i] = 'update_existing'; }); // Default: update/merge
        setConflictActions(initialActions);
        setConflicts({ conflicts: conflicting, noConflict });
        setIsOpen(false);
      } else {
        bulkImportCustomers(mergedData);
        const now = new Date().toISOString();
        localStorage.setItem(`last_csv_import_${type}`, now);
        setLastImportDate(now);
        setIsOpen(false);
      }
    } else if (type === 'bookings') {
      bulkImportBookings(data);
      setIsOpen(false);
    }
  };

  const handleResolveConflicts = async () => {
    const { conflicts: conflictList, noConflict } = conflicts;

    if (type === 'equipment') {
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
    } else if (type === 'customers') {
      // Import non-conflicting items first
      if (noConflict.length > 0) {
        await bulkImportCustomers(noConflict);
      }

      // Resolve conflicts
      const actions = conflictList.map((c, i) => ({
        action: conflictActions[i],
        importedItem: c.importedItem,
        existingItem: c.existingItem
      }));

      await resolveCustomerConflicts(actions);
    }

    const now = new Date().toISOString();
    localStorage.setItem(`last_csv_import_${type}`, now);
    setLastImportDate(now);
    setConflicts(null);
    setConflictActions({});
  };

    const getFallbackDate = () => {
      if (type === 'equipment' && equipment && equipment.length > 0) {
        const latest = Math.max(...equipment.map(e => new Date(e.created_at || 0).getTime()));
        return new Date(latest).toISOString();
      }
      if (type === 'customers' && customers && customers.length > 0) {
        const latest = Math.max(...customers.map(c => new Date(c.created_at || 0).getTime()));
        return new Date(latest).toISOString();
      }
      return null;
    };

    const displayDate = lastImportDate || getFallbackDate();

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setIsOpen(true)}
        >
          Importer depuis CSV
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-light)', fontStyle: 'italic' }}>
          Dernière maj : {displayDate ? new Date(displayDate).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "Inconnue"}
        </span>
      </div>

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
              {type === 'equipment' ? '⚠️ Références identiques détectées !' : '⚠️ Doublons de clients détectés !'}
            </h2>
            <p style={{ color: 'var(--text-light)', marginBottom: '24px', fontSize: '14px' }}>
              {type === 'equipment' 
                ? `${conflicts.conflicts.length} équipement(s) ont une référence identique à un produit déjà existant. Choisissez l'action à effectuer pour chacun.`
                : `${conflicts.conflicts.length} client(s) ont le même email ou nom qu'un client déjà existant. Choisissez l'action à effectuer pour chacun.`
              }
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
                      {type === 'equipment' ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{c.existingItem.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            Réf: {c.existingItem.reference} — Stock actuel: {c.existingItem.quantity || 1}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600 }}>{c.existingItem.first_name} {c.existingItem.last_name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            Email: {c.existingItem.email || 'N/A'} — Tél: {c.existingItem.phone || 'N/A'}
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#D97706', fontWeight: 'bold', fontSize: '20px' }}>
                      VS
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#1E40AF', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Import CSV
                      </div>
                      {type === 'equipment' ? (
                        <>
                          <div style={{ fontWeight: 600 }}>{c.importedItem.name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            Réf: {c.importedItem.reference} — Qté: {c.importedItem.quantity || 1}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 600 }}>{c.importedItem.first_name} {c.importedItem.last_name}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            Email: {c.importedItem.email || 'N/A'} — Tél: {c.importedItem.phone || 'N/A'}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {type === 'equipment' ? (
                      <>
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
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setConflictActions({ ...conflictActions, [i]: 'update_existing' })}
                          style={{
                            padding: '8px 16px', borderRadius: '8px', border: '2px solid',
                            borderColor: conflictActions[i] === 'update_existing' ? '#16A34A' : 'var(--border-color, #e5e7eb)',
                            backgroundColor: conflictActions[i] === 'update_existing' ? '#DCFCE7' : 'transparent',
                            color: conflictActions[i] === 'update_existing' ? '#15803D' : 'var(--text-main)',
                            cursor: 'pointer', fontWeight: conflictActions[i] === 'update_existing' ? 600 : 400, fontSize: '13px'
                          }}
                        >
                          🔄 Fusionner / Mettre à jour les coordonnées
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
                          ➕ Créer en tant que doublon
                        </button>
                      </>
                    )}
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
                ✅ {conflicts.noConflict.length} autre(s) {type === 'equipment' ? 'équipement(s)' : 'client(s)'} sans conflit seront importés normalement.
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
