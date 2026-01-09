import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const db = new Database(join(dataDir, 'database.sqlite'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database tables
export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      userType TEXT DEFAULT 'school_staff',
      contactName TEXT NOT NULL,
      positionTitle TEXT,
      department TEXT,
      schoolName TEXT,
      principalName TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'user',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      priceMin REAL NOT NULL,
      priceMax REAL NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      imageUrl TEXT,
      images TEXT,
      options TEXT,
      features TEXT,
      inStock INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      productId TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      selectedOptions TEXT,
      calculatedPrice REAL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      shippingInfo TEXT NOT NULL,
      notes TEXT,
      assignedTo TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (assignedTo) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_notes (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (adminId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(userId);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(userId);
  `);

  // Migration: Add new columns if they don't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN positionTitle TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN principalName TEXT`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN userType TEXT DEFAULT 'school_staff'`);
  } catch (e) {
    // Column already exists
  }
  try {
    db.exec(`ALTER TABLE users ADD COLUMN department TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add assignedTo column to orders if it doesn't exist
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN assignedTo TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Migration: Add orderNumber column to orders if it doesn't exist
  try {
    db.exec(`ALTER TABLE orders ADD COLUMN orderNumber TEXT`);
  } catch (e) {
    // Column already exists
  }

  // Backfill orderNumber for existing orders that don't have one
  // Format: XXXX-MMDDYY-NNN (name initials - date - daily sequence)
  try {
    const ordersWithoutNumber = db.prepare(`
      SELECT o.id, o.createdAt, o.shippingInfo, u.contactName as userContactName
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
      WHERE o.orderNumber IS NULL OR o.orderNumber LIKE 'ORD-%'
      ORDER BY o.createdAt ASC
    `).all();

    if (ordersWithoutNumber.length > 0) {
      const updateStmt = db.prepare(`UPDATE orders SET orderNumber = ? WHERE id = ?`);
      const dailyCounts = {};

      ordersWithoutNumber.forEach((order) => {
        // Get contact name from shippingInfo or user
        let contactName = 'Unknown User';
        try {
          const shippingInfo = JSON.parse(order.shippingInfo || '{}');
          contactName = shippingInfo.contactName || order.userContactName || 'Unknown User';
        } catch (e) {
          contactName = order.userContactName || 'Unknown User';
        }

        // Generate name prefix
        const nameParts = contactName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'XX';
        const lastName = nameParts[nameParts.length - 1] || 'XX';
        const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();

        // Generate date string
        const date = new Date(order.createdAt);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        const dateStr = `${month}${day}${year}`;

        // Track daily sequence
        const dateKey = `${month}${day}${year}`;
        dailyCounts[dateKey] = (dailyCounts[dateKey] || 0) + 1;

        const orderNumber = `${namePrefix}-${dateStr}-${dailyCounts[dateKey].toString().padStart(3, '0')}`;
        updateStmt.run(orderNumber, order.id);
      });
      console.log(`Backfilled ${ordersWithoutNumber.length} order numbers`);
    }
  } catch (e) {
    console.error('Error backfilling order numbers:', e.message);
  }

  // Create order_notes table if it doesn't exist (for existing databases)
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_notes (
      id TEXT PRIMARY KEY,
      orderId TEXT NOT NULL,
      adminId TEXT NOT NULL,
      note TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (adminId) REFERENCES users(id)
    );
  `);

  // Create indexes after migrations (to avoid errors on existing databases)
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_assigned ON orders(assignedTo);`);
  } catch (e) {
    // Index might already exist
  }
  try {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_order_notes ON order_notes(orderId);`);
  } catch (e) {
    // Index might already exist
  }

  console.log('Database initialized successfully');
}

export default db;
