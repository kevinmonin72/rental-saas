'use client';

import { useState } from 'react';
import CsvImporter from './CsvImporter';
import { bulkImportEquipment, bulkImportCustomers, bulkImportBookings } from '../app/actions';

export default function CsvImporterButton({ type }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleImport = async (data) => {
    if (type === 'equipment') {
      await bulkImportEquipment(data);
    } else if (type === 'customers') {
      await bulkImportCustomers(data);
    } else if (type === 'bookings') {
      await bulkImportBookings(data);
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
