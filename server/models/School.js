import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const School = {
  create: ({ name, principal_name, address, city, state, zip, phone, email, district, is_active = true }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO schools (id, name, principal_name, address, city, state, zip, phone, email, district, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      name,
      principal_name || null,
      address || null,
      city || null,
      state || null,
      zip || null,
      phone || null,
      email || null,
      district || null,
      is_active ? 1 : 0,
      now,
      now
    );

    return School.findById(id);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM schools WHERE id = ?');
    const school = stmt.get(id);
    if (school) {
      school.is_active = !!school.is_active;
    }
    return school;
  },

  findByName: (name) => {
    const stmt = db.prepare('SELECT * FROM schools WHERE name = ?');
    const school = stmt.get(name);
    if (school) {
      school.is_active = !!school.is_active;
    }
    return school;
  },

  getAll: () => {
    const stmt = db.prepare('SELECT * FROM schools ORDER BY name ASC');
    return stmt.all().map(school => ({
      ...school,
      is_active: !!school.is_active
    }));
  },

  getActive: () => {
    const stmt = db.prepare('SELECT * FROM schools WHERE is_active = 1 ORDER BY name ASC');
    return stmt.all().map(school => ({
      ...school,
      is_active: true
    }));
  },

  update: (id, { name, principal_name, address, city, state, zip, phone, email, district, is_active }) => {
    const now = new Date().toISOString();
    const existing = School.findById(id);
    if (!existing) return null;

    const stmt = db.prepare(`
      UPDATE schools SET
        name = COALESCE(?, name),
        principal_name = ?,
        address = ?,
        city = ?,
        state = ?,
        zip = ?,
        phone = ?,
        email = ?,
        district = ?,
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name || existing.name,
      principal_name !== undefined ? principal_name : existing.principal_name,
      address !== undefined ? address : existing.address,
      city !== undefined ? city : existing.city,
      state !== undefined ? state : existing.state,
      zip !== undefined ? zip : existing.zip,
      phone !== undefined ? phone : existing.phone,
      email !== undefined ? email : existing.email,
      district !== undefined ? district : existing.district,
      is_active !== undefined ? (is_active ? 1 : 0) : null,
      now,
      id
    );

    return School.findById(id);
  },

  toggleActive: (id) => {
    const existing = School.findById(id);
    if (!existing) return null;

    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE schools SET is_active = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(existing.is_active ? 0 : 1, now, id);

    return School.findById(id);
  },

  delete: (id) => {
    const stmt = db.prepare('DELETE FROM schools WHERE id = ?');
    return stmt.run(id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM schools');
    return stmt.get().count;
  },

  countActive: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM schools WHERE is_active = 1');
    return stmt.get().count;
  },

  // Get all users assigned to a specific school
  getSchoolUsers: (schoolId) => {
    const stmt = db.prepare(`
      SELECT id, email, userType, contactName, positionTitle, supervisor, role, createdAt
      FROM users
      WHERE school_id = ?
      ORDER BY contactName ASC
    `);
    return stmt.all(schoolId);
  },

  // Get user count for each school
  getUserCounts: () => {
    const stmt = db.prepare(`
      SELECT school_id, COUNT(*) as user_count
      FROM users
      WHERE school_id IS NOT NULL
      GROUP BY school_id
    `);
    const counts = stmt.all();
    const countMap = {};
    counts.forEach(row => {
      countMap[row.school_id] = row.user_count;
    });
    return countMap;
  },

  // Get all schools with user counts
  getAllWithUserCounts: () => {
    const schools = School.getAll();
    const userCounts = School.getUserCounts();
    return schools.map(school => ({
      ...school,
      user_count: userCounts[school.id] || 0
    }));
  }
};
