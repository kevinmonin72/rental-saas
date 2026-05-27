'use client';

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStore } from '../lib/store';

// Helper to convert array of objects to CSV
function convertToCSV(arr) {
  if (arr.length === 0) return '';
  const keys = Object.keys(arr[0]);
  const replacer = (key, value) => value === null ? '' : value;
  const processRow = row => keys.map(key => JSON.stringify(row[key], replacer)).join(',');
  return [keys.join(','), ...arr.map(processRow)].join('\r\n');
}

export default function ExportButton() {
  const store = useStore();

  const handleExport = () => {
    const zip = new JSZip();

    const equipmentCsv = convertToCSV(store.equipment);
    const customersCsv = convertToCSV(store.customers);
    const bookingsCsv = convertToCSV(store.bookings);
    const bookingItemsCsv = convertToCSV(store.bookingItems);

    if (equipmentCsv) zip.file("equipment.csv", equipmentCsv);
    if (customersCsv) zip.file("customers.csv", customersCsv);
    if (bookingsCsv) zip.file("bookings.csv", bookingsCsv);
    if (bookingItemsCsv) zip.file("booking_items.csv", bookingItemsCsv);

    zip.generateAsync({ type: "blob" }).then(function(content) {
      saveAs(content, "sauvegarde-ridery-wingboost.zip");
    });
  };

  return (
    <button className="btn btn-secondary" onClick={handleExport}>
      Exporter les données (.zip)
    </button>
  );
}
