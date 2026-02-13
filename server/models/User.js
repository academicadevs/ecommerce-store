import db from '../utils/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const User = {
  create: async ({ email, password, userType, contactName, positionTitle, department, schoolName, principalName, phone, address, school_id, supervisor, office_id }) => {
    const id = uuidv4();
    const finalUserType = userType || 'school_staff';

    if (!password || password.length < 6) {
      throw new Error('Password is required (min 6 characters)');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address, school_id, supervisor, office_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      email,
      hashedPassword,
      finalUserType,
      contactName,
      null,
      positionTitle || null,
      department || null,
      schoolName || 'N/A',
      principalName || null,
      phone || null,
      address || null,
      school_id || null,
      supervisor || null,
      office_id || null
    );

    return { id, email, userType: finalUserType, contactName, positionTitle, department, schoolName, principalName, phone, address, school_id, supervisor, office_id, role: 'user' };
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
    // Try exact (case-sensitive) comparison first — new passwords
    const exact = await bcrypt.compare(plainPassword, hashedPassword);
    if (exact) return true;
    // Fallback: try lowercase comparison — legacy staff whose middleName was lowercased
    return bcrypt.compare(plainPassword.toLowerCase(), hashedPassword);
  },

  getAll: () => {
    const stmt = db.prepare('SELECT id, email, userType, contactName, positionTitle, department, schoolName, principalName, phone, address, role, createdAt, school_id, supervisor, office_id, password_needs_update FROM users ORDER BY createdAt DESC');
    return stmt.all();
  },

  updateRole: (id, role) => {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, id);
  },

  updateUserType: (id, userType) => {
    const stmt = db.prepare('UPDATE users SET userType = ? WHERE id = ?');
    stmt.run(userType, id);
  },

  updateProfile: (id, { contactName, positionTitle, department, schoolName, principalName, phone, email, school_id, supervisor, office_id }) => {
    const stmt = db.prepare(`
      UPDATE users SET
        contactName = COALESCE(?, contactName),
        positionTitle = ?,
        department = ?,
        schoolName = COALESCE(?, schoolName),
        principalName = ?,
        phone = ?,
        email = COALESCE(?, email),
        school_id = ?,
        supervisor = ?,
        office_id = ?
      WHERE id = ?
    `);
    stmt.run(contactName, positionTitle || null, department || null, schoolName, principalName || null, phone || null, email, school_id !== undefined ? school_id : null, supervisor !== undefined ? supervisor : null, office_id !== undefined ? office_id : null, id);
    return User.findById(id);
  },

  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, password_needs_update = 0 WHERE id = ?');
    stmt.run(hashedPassword, id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
  },

  countByType: (userType) => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE userType = ?');
    return stmt.get(userType).count;
  },

  createGuest: async ({ email, contactName, phone, schoolName }) => {
    const existing = User.findByEmail(email);
    if (existing) {
      return existing;
    }

    const id = uuidv4();
    const randomPassword = uuidv4();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, userType, schoolName, contactName, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, hashedPassword, 'guest', schoolName || 'N/A', contactName, phone || null);

    return { id, email, userType: 'guest', schoolName: schoolName || 'N/A', contactName, phone: phone || null, role: 'user' };
  },

  createQuickUser: async ({ contactName, email, phone, schoolName }) => {
    if (email) {
      const existing = User.findByEmail(email);
      if (existing) return existing;
    }

    const id = uuidv4();
    const finalEmail = email || null;
    const randomPassword = uuidv4();
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, userType, schoolName, contactName, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, finalEmail, hashedPassword, 'guest', schoolName || 'N/A', contactName, phone || null);

    return { id, email: finalEmail, userType: 'guest', schoolName: schoolName || 'N/A', contactName, phone: phone || null, role: 'user' };
  },

  createAdmin: async ({ email, password }) => {
    const existing = User.findByEmail(email);
    if (existing) {
      // Ensure the default admin is always a superadmin
      if (existing.role !== 'admin') {
        User.updateRole(existing.id, 'admin');
      }
      if (existing.userType !== 'superadmin') {
        User.updateUserType(existing.id, 'superadmin');
      }
      return existing;
    }

    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, userType, schoolName, contactName, role)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, email, hashedPassword, 'superadmin', 'Admin', 'Super Administrator', 'admin');

    return { id, email, userType: 'superadmin', schoolName: 'Admin', contactName: 'Super Administrator', role: 'admin' };
  },

  // Password reset token methods
  setPasswordResetToken: (id, hashedToken, expiresAt) => {
    const stmt = db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?');
    stmt.run(hashedToken, expiresAt, id);
  },

  findByResetToken: (hashedToken) => {
    const stmt = db.prepare('SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > ?');
    return stmt.get(hashedToken, new Date().toISOString());
  },

  clearResetToken: (id) => {
    const stmt = db.prepare('UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?');
    stmt.run(id);
  },
};
