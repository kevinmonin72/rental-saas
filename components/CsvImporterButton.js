'use client';

import { useState } from 'react';
import CsvImporter from './CsvImporter';
import { useStore } from '../lib/store';

export default function CsvImporterButton({ type }) {
  const [isOpen, setIsOpen] = useState(false);
  const { bulkImportEquipment, bulkImportCustomers, bulkImportBookings } = useStore();

  const handleImport = (data) => {
    if (type === 'equipment') {
      bulkImportEquipment(data);
    } else if (type === 'customers') {
      bulkImportCustomers(data);
    } else if (type === 'bookings') {
      bulkImportBookings(data);
    }
    setIsOpen(false);
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
    </>
  );
}
