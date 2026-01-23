import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Office = {
  create: ({ name, address, city, state, zip, phone, email, is_active = true }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO offices (id, name, address, city, state, zip, phone, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      address || null,
      city || null,
      state || null,
      zip || null,
      phone || null,
      email || null,
      is_active ? 1 : 0,
      now,
      now
    );

    return Office.findById(id);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM offices WHERE id = ?');
    const office = stmt.get(id);
    if (office) {
      office.is_active = !!office.is_active;
    }
    return office;
  },

  findByName: (name) => {
    const stmt = db.prepare('SELECT * FROM offices WHERE name = ?');
    const office = stmt.get(name);
    if (office) {
      office.is_active = !!office.is_active;
    }
    return office;
  },

  getAll: () => {
    const stmt = db.prepare('SELECT * FROM offices ORDER BY name ASC');
    return stmt.all().map(office => ({
      ...office,
      is_active: !!office.is_active
    }));
  },

  getActive: () => {
    const stmt = db.prepare('SELECT * FROM offices WHERE is_active = 1 ORDER BY name ASC');
    return stmt.all().map(office => ({
      ...office,
      is_active: true
    }));
  },

  update: (id, { name, address, city, state, zip, phone, email, is_active }) => {
    const now = new Date().toISOString();
    const existing = Office.findById(id);
    if (!existing) return null;

    const stmt = db.prepare(`
      UPDATE offices SET
        name = COALESCE(?, name),
        address = ?,
        city = ?,
        state = ?,
        zip = ?,
        phone = ?,
        email = ?,
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name || existing.name,
      address !== undefined ? address : existing.address,
      city !== undefined ? city : existing.city,
      state !== undefined ? state : existing.state,
      zip !== undefined ? zip : existing.zip,
      phone !== undefined ? phone : existing.phone,
      email !== undefined ? email : existing.email,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      now,
      id
    );

    return Office.findById(id);
  },

  toggleActive: (id) => {
    const existing = Office.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE offices SET is_active = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(existing.is_active ? 0 : 1, now, id);

    return Office.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM offices WHERE id = ?');
    return stmt.run(id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM offices');
    return stmt.get().count;
  },

  countActive: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM offices WHERE is_active = 1');
    return stmt.get().count;
  },

  // Get all users assigned to a specific office
  getOfficeUsers: (officeId) => {
    const stmt = db.prepare(`
      SELECT id, email, userType, contactName, positionTitle, department, role, createdAt
      FROM users
      WHERE office_id = ?
      ORDER BY contactName ASC
    `);
    return stmt.all(officeId);
  },

  // Get user count for each office
  getUserCounts: () => {
    const stmt = db.prepare(`
      SELECT office_id, COUNT(*) as user_count
      FROM users
      WHERE office_id IS NOT NULL
      GROUP BY office_id
    `);
    const counts = stmt.all();
    const countMap = {};
    counts.forEach(row => {
      countMap[row.office_id] = row.user_count;
    });
    return countMap;
  },

  // Get all offices with user counts
  getAllWithUserCounts: () => {
    const offices = Office.getAll();
    const userCounts = Office.getUserCounts();
    return offices.map(office => ({
      ...office,
      user_count: userCounts[office.id] || 0
    }));
  }
};
