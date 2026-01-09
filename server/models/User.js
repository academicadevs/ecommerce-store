import db from '../utils/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const User = {
  create: async ({ email, password, schoolName, contactName, phone, address }) => {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, schoolName, contactName, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, hashedPassword, schoolName, contactName, phone || null, address || null);

    return { id, email, schoolName, contactName, phone, address, role: 'user' };
  },

  findByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  validatePassword: async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },

  getAll: () => {
    const stmt = db.prepare('SELECT id, email, schoolName, contactName, phone, address, role, createdAt FROM users ORDER BY createdAt DESC');
    return stmt.all();
  },

  updateRole: (id, role) => {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  },

  createAdmin: async ({ email, password }) => {
    const existing = User.findByEmail(email);
    if (existing) {
      if (existing.role !== 'admin') {
        User.updateRole(existing.id, 'admin');
      }
      return existing;
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, schoolName, contactName, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, hashedPassword, 'Admin', 'Administrator', 'admin');

    return { id, email, schoolName: 'Admin', contactName: 'Administrator', role: 'admin' };
  }
};
