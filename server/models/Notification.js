import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Notification = {
  create: ({ type, title, body, orderId, userId, sourceId, sourceType, metadata }) => {
    const id = uuidv4();
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO notifications (id, type, title, body, orderId, userId, sourceId, sourceType, metadata, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, title, body || null, orderId || null, userId || null, sourceId || null, sourceType || null, metadata ? JSON.stringify(metadata) : null, createdAt);

    return { id, type, title, body, orderId, userId, sourceId, sourceType, isRead: 0, metadata, createdAt };
  },

  getAll: ({ page = 1, limit = 20, type, isRead, search, adminId } = {}) => {
    let where = 'WHERE 1=1';
    const params = [];

    if (type) {
      where += ' AND n.type = ?';
      params.push(type);
    }
    if (isRead !== undefined && isRead !== null && isRead !== '') {
      if (Number(isRead) === 1) {
        where += ' AND nr.notificationId IS NOT NULL';
      } else {
        where += ' AND nr.notificationId IS NULL';
      }
    }
    if (search) {
      where += ' AND (n.title LIKE ? OR n.body LIKE ? OR n.metadata LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const offset = (page - 1) * limit;

    const rows = db.prepare(`
      SELECT n.*, CASE WHEN nr.notificationId IS NOT NULL THEN 1 ELSE 0 END as isRead
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notificationId = n.id AND nr.userId = ?
      ${where}
      ORDER BY n.createdAt DESC
      LIMIT ? OFFSET ?
    `).all(adminId, ...params, limit, offset);

    const countResult = db.prepare(`
      SELECT COUNT(*) as total
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notificationId = n.id AND nr.userId = ?
      ${where}
    `).get(adminId, ...params);

    return {
      notifications: rows.map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null })),
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit),
    };
  },

  getRecent: (limit = 20, adminId) => {
    const rows = db.prepare(`
      SELECT n.*, CASE WHEN nr.notificationId IS NOT NULL THEN 1 ELSE 0 END as isRead
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notificationId = n.id AND nr.userId = ?
      ORDER BY n.createdAt DESC
      LIMIT ?
    `).all(adminId, limit);

    return rows.map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
  },

  getUnreadCount: (adminId) => {
    return db.prepare(`
      SELECT COUNT(*) as count FROM notifications n
      WHERE NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notificationId = n.id AND nr.userId = ?)
    `).get(adminId).count;
  },

  markAsRead: (id, adminId) => {
    db.prepare(`
      INSERT OR IGNORE INTO notification_reads (notificationId, userId, readAt) VALUES (?, ?, ?)
    `).run(id, adminId, new Date().toISOString());
  },

  markAsUnread: (id, adminId) => {
    db.prepare(`DELETE FROM notification_reads WHERE notificationId = ? AND userId = ?`).run(id, adminId);
  },

  markAllAsRead: (adminId) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO notification_reads (notificationId, userId, readAt)
      SELECT id, ?, ? FROM notifications n
      WHERE NOT EXISTS (SELECT 1 FROM notification_reads nr WHERE nr.notificationId = n.id AND nr.userId = ?)
    `).run(adminId, now, adminId);
  },

  bulkMarkAsRead: (ids, adminId) => {
    if (!ids || ids.length === 0) return;
    const now = new Date().toISOString();
    const stmt = db.prepare(`INSERT OR IGNORE INTO notification_reads (notificationId, userId, readAt) VALUES (?, ?, ?)`);
    for (const id of ids) {
      stmt.run(id, adminId, now);
    }
  },

  bulkMarkAsUnread: (ids, adminId) => {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM notification_reads WHERE notificationId IN (${placeholders}) AND userId = ?`).run(...ids, adminId);
  },

  markAsReadByOrder: (orderId, adminId) => {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT OR IGNORE INTO notification_reads (notificationId, userId, readAt)
      SELECT id, ?, ? FROM notifications WHERE orderId = ?
    `).run(adminId, now, orderId);
  },
};
