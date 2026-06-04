'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div style={{ padding: '24px' }}>Chargement...</div>;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1>Paramètres</h1>
        <p style={{ color: 'var(--text-light)', marginTop: '4px' }}>
          Gérez la configuration globale de votre application de location.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Équipements Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', height: '100%' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📦</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Gestion des Équipements</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Consultez et gérez la liste de votre matériel (ailes, planches, foils, mâts, platines et accessoires). Modifiez les références, ajustez les quantités disponibles et gérez les conflits d'importation CSV.
            </p>
          </div>
          <Link href="/inventory" className="btn btn-primary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            Accéder aux Équipements
          </Link>
        </div>

        {/* Clients Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', height: '100%' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>👥</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Gestion des Clients</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Gérez la base de données de vos clients. Ajoutez de nouveaux profils, modifiez leurs coordonnées (email, téléphone), importez votre base existante par CSV et gérez les doublons lors des synchronisations.
            </p>
          </div>
          <Link href="/customers" className="btn btn-primary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            Accéder aux Clients
          </Link>
        </div>

        {/* Facturation Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', height: '100%' }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🧾</div>
            <h2 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Générateur de Factures</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px 0' }}>
              Créez rapidement une facture personnalisée (ponctuelle) en saisissant les informations du client et les lignes de facturation. Générez ensuite un PDF à télécharger ou imprimer.
            </p>
          </div>
          <Link href="/settings/invoice" className="btn btn-primary" style={{ textAlign: 'center', display: 'block', textDecoration: 'none' }}>
            Créer une facture
          </Link>
        </div>

      </div>
    </div>
  );
}
