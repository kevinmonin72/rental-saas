import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

async function initDb() {
  const db = await open({
    filename: path.join(process.cwd(), 'local.db'),
    driver: sqlite3.Database
  });

  console.log('Creating tables...');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      total_quantity INTEGER NOT NULL,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      start_date TEXT NOT NULL, -- YYYY-MM-DD
      end_date TEXT NOT NULL,   -- YYYY-MM-DD
      status TEXT NOT NULL,     -- 'pending', 'confirmed', 'completed'
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS booking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (equipment_id) REFERENCES equipment(id)
    );
  `);

  console.log('Tables created successfully.');
  await db.close();
}

initDb().catch((err) => {
  console.error('Error initializing database:', err);
});
