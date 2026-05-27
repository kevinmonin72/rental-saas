'use server'

import { openDb } from '../lib/db';
import { revalidatePath } from 'next/cache';

export async function addEquipment(formData) {
  const name = formData.get('name');
  const category = formData.get('category');
  const description = formData.get('description');
  const quantity = parseInt(formData.get('quantity'), 10);
  
  if (!name || !category || isNaN(quantity)) return;

  const db = await openDb();
  await db.run(
    'INSERT INTO equipment (name, category, description, total_quantity) VALUES (?, ?, ?, ?)',
    [name, category, description, quantity]
  );

  revalidatePath('/inventory');
}

export async function addCustomer(formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone');
  
  if (!firstName || !lastName || !email) return;

  const db = await openDb();
  await db.run(
    'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
    [firstName, lastName, email, phone]
  );

  revalidatePath('/customers');
}

export async function bulkImportCustomers(customerList) {
  const db = await openDb();
  for (const c of customerList) {
    if (!c.first_name && !c.last_name) continue;
    await db.run(
      'INSERT INTO customers (first_name, last_name, email, phone) VALUES (?, ?, ?, ?)',
      [c.first_name || '', c.last_name || '', c.email || '', c.phone || '']
    );
  }
  revalidatePath('/customers');
}

export async function bulkImportBookings(bookingList) {
  const db = await openDb();
  for (const b of bookingList) {
    if (!b.customer_id || !b.equipment_id || !b.start_date || !b.end_date) continue;
    
    // Insert booking
    const result = await db.run(
      'INSERT INTO bookings (customer_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
      [b.customer_id, b.start_date, b.end_date, 'active']
    );
    
    // Insert booking item
    await db.run(
      'INSERT INTO booking_items (booking_id, equipment_id, quantity) VALUES (?, ?, ?)',
      [result.lastID, b.equipment_id, parseInt(b.quantity, 10) || 1]
    );
  }
  revalidatePath('/bookings');
  revalidatePath('/'); // Refresh dashboard widget too
}

export async function createBooking(formData) {
  const customerId = parseInt(formData.get('customerId'), 10);
  const startDate = formData.get('startDate');
  const endDate = formData.get('endDate');
  const equipmentId = parseInt(formData.get('equipmentId'), 10);
  const quantity = parseInt(formData.get('quantity'), 10) || 1;
  
  if (isNaN(customerId) || !startDate || !endDate || isNaN(equipmentId)) return;

  const db = await openDb();
  
  // Start transaction
  await db.run('BEGIN TRANSACTION');
  try {
    const result = await db.run(
      'INSERT INTO bookings (customer_id, start_date, end_date, status) VALUES (?, ?, ?, ?)',
      [customerId, startDate, endDate, 'confirmed']
    );
    
    await db.run(
      'INSERT INTO booking_items (booking_id, equipment_id, quantity) VALUES (?, ?, ?)',
      [result.lastID, equipmentId, quantity]
    );
    
    await db.run('COMMIT');
  } catch (err) {
    await db.run('ROLLBACK');
    console.error(err);
  }

  revalidatePath('/bookings');
  revalidatePath('/'); // update dashboard stats
}
