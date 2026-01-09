import db from '../utils/database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const User = {
  create: async ({ email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address }) => {
    const id = uuidv4();
    const finalUserType = userType || 'school_staff';

    // For staff users, use middle name as password
    const isStaffUser = finalUserType === 'school_staff' || finalUserType === 'academica_employee';
    const passwordToHash = isStaffUser ? middleName : password;

    if (!passwordToHash) {
      throw new Error(isStaffUser ? 'Middle name is required' : 'Password is required');
    }

    const hashedPassword = await bcrypt.hash(passwordToHash, 10);

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      email,
      hashedPassword,
      finalUserType,
      contactName,
      middleName || null,
      positionTitle || null,
      department || null,
      schoolName || 'N/A',
      principalName || null,
      phone || null,
      address || null
    );

    return { id, email, userType: finalUserType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address, role: 'user' };
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
    const stmt = db.prepare('SELECT id, email, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, address, role, createdAt FROM users ORDER BY createdAt DESC');
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

  updateProfile: (id, { contactName, middleName, positionTitle, department, schoolName, principalName, phone, email }) => {
    const stmt = db.prepare(`
      UPDATE users SET
        contactName = COALESCE(?, contactName),
        middleName = COALESCE(?, middleName),
        positionTitle = ?,
        department = ?,
        schoolName = COALESCE(?, schoolName),
        principalName = ?,
        phone = ?,
        email = COALESCE(?, email)
      WHERE id = ?
    `);
    stmt.run(contactName, middleName, positionTitle || null, department || null, schoolName, principalName || null, phone || null, email, id);
    return User.findById(id);
  },

  // Update middle name and password for staff users (middle name IS their password)
  updateMiddleNameAndPassword: async (id, middleName) => {
    const hashedPassword = await bcrypt.hash(middleName, 10);
    const stmt = db.prepare('UPDATE users SET middleName = ?, password = ? WHERE id = ?');
    stmt.run(middleName, hashedPassword, id);
  },

  updatePassword: async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ? WHERE id = ?');
    stmt.run(hashedPassword, id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM users');
    return stmt.get().count;
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
  }
};
