import { openDb } from '../../../lib/db';
import AdmZip from 'adm-zip';
import { parse } from 'json2csv';

export async function GET() {
  try {
    const db = await openDb();

    // Fetch all tables
    const equipment = await db.all('SELECT * FROM equipment');
    const customers = await db.all('SELECT * FROM customers');
    const bookings = await db.all('SELECT * FROM bookings');
    const bookingItems = await db.all('SELECT * FROM booking_items');

    // Convert to CSV
    const equipmentCsv = equipment.length > 0 ? parse(equipment) : 'id,name,category,quantity';
    const customersCsv = customers.length > 0 ? parse(customers) : 'id,first_name,last_name,email,phone';
    const bookingsCsv = bookings.length > 0 ? parse(bookings) : 'id,customer_id,start_date,end_date,status';
    const bookingItemsCsv = bookingItems.length > 0 ? parse(bookingItems) : 'id,booking_id,equipment_id,quantity';

    // Create zip
    const zip = new AdmZip();
    zip.addFile("equipment.csv", Buffer.from(equipmentCsv, "utf8"));
    zip.addFile("customers.csv", Buffer.from(customersCsv, "utf8"));
    zip.addFile("bookings.csv", Buffer.from(bookingsCsv, "utf8"));
    zip.addFile("booking_items.csv", Buffer.from(bookingItemsCsv, "utf8"));

    const zipBuffer = zip.toBuffer();

    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="sauvegarde-ridery-wingboost.zip"'
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    return new Response(JSON.stringify({ error: 'Export failed' }), { status: 500 });
  }
}
