import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const AuditLog = {
  create: ({ action, category, userId, targetId, targetType, details, ipAddress }) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audit_logs (id, action, category, userId, targetId, targetType, details, ipAddress, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, action, category, userId || null, targetId || null, targetType || null, details ? JSON.stringify(details) : null, ipAddress || null, createdAt);

    return { id, action, category, userId, targetId, targetType, details, ipAddress, createdAt };
  },

  getAll: ({ page = 1, limit = 50, category, action, userId, startDate, endDate, search } = {}) => {
    let where = 'WHERE 1=1';
    const params = [];

    if (category) {
      where += ' AND al.category = ?';
      params.push(category);
    }
    if (action) {
      where += ' AND al.action = ?';
      params.push(action);
    }
    if (userId) {
      where += ' AND al.userId = ?';
      params.push(userId);
    }
    if (startDate) {
      where += ' AND al.createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND al.createdAt <= ?';
      params.push(endDate);
    }
    if (search) {
      where += ' AND (al.action LIKE ? OR al.details LIKE ? OR u.contactName LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT al.*, u.contactName as actorName, u.email as actorEmail
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      ${where}
      ORDER BY al.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null,
    }));
  },

  getRecent: (limit = 8) => {
    const rows = db.prepare(`
      SELECT al.*, u.contactName as actorName, u.email as actorEmail
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      ORDER BY al.createdAt DESC
      LIMIT ?
    `).all(limit);

    return rows.map(row => ({
      ...row,
      details: row.details ? JSON.parse(row.details) : null,
    }));
  },

  getFilters: () => {
    const categories = db.prepare('SELECT DISTINCT category FROM audit_logs ORDER BY category').all().map(r => r.category);
    const actions = db.prepare('SELECT DISTINCT action FROM audit_logs ORDER BY action').all().map(r => r.action);
    const actors = db.prepare(`
      SELECT DISTINCT u.id, u.contactName, u.email
      FROM audit_logs al
      INNER JOIN users u ON al.userId = u.id
      ORDER BY u.contactName
    `).all();
    return { categories, actions, actors };
  },

  count: ({ category, action, userId, startDate, endDate, search } = {}) => {
    let where = 'WHERE 1=1';
    const params = [];

    if (category) {
      where += ' AND al.category = ?';
      params.push(category);
    }
    if (action) {
      where += ' AND al.action = ?';
      params.push(action);
    }
    if (userId) {
      where += ' AND al.userId = ?';
      params.push(userId);
    }
    if (startDate) {
      where += ' AND al.createdAt >= ?';
      params.push(startDate);
    }
    if (endDate) {
      where += ' AND al.createdAt <= ?';
      params.push(endDate);
    }
    if (search) {
      where += ' AND (al.action LIKE ? OR al.details LIKE ? OR u.contactName LIKE ? OR u.email LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const result = db.prepare(`
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      ${where}
    `).get(...params);

    return result.total;
  },
};
