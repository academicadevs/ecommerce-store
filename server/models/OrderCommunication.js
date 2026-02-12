import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const OrderCommunication = {
  create: ({ orderId, direction, adminId, senderEmail, recipientEmail, subject, body, replyToToken, attachments, messageId }) => {
    const id = uuidv4();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO order_communications (id, orderId, direction, adminId, senderEmail, recipientEmail, subject, body, replyToToken, attachments, messageId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      orderId,
      direction,
      adminId || null,
      senderEmail,
      recipientEmail,
      subject,
      body,
      replyToToken || null,
      attachments ? JSON.stringify(attachments) : null,
      messageId || null,
      now
    );
    return OrderCommunication.findById(id);
  },

  findById: (id) => {
    const stmt = db.prepare(`
      SELECT oc.*, u.contactName as adminName, u.email as adminEmail
      FROM order_communications oc
      LEFT JOIN users u ON oc.adminId = u.id
      WHERE oc.id = ?
    `);
    const comm = stmt.get(id);
    if (comm && comm.attachments) {
      comm.attachments = JSON.parse(comm.attachments);
    }
    return comm;
  },

  getByOrderId: (orderId) => {
    const stmt = db.prepare(`
      SELECT oc.*, u.contactName as adminName, u.email as adminEmail
      FROM order_communications oc
      LEFT JOIN users u ON oc.adminId = u.id
      WHERE oc.orderId = ?
      ORDER BY oc.createdAt ASC
    `);
    const comms = stmt.all(orderId);
    return comms.map(comm => {
      if (comm.attachments) {
        comm.attachments = JSON.parse(comm.attachments);
      }
      return comm;
    });
  },

  findByReplyToken: (replyToToken) => {
    const stmt = db.prepare(`
      SELECT * FROM order_communications
      WHERE replyToToken = ?
      ORDER BY createdAt DESC
      LIMIT 1
    `);
    const comm = stmt.get(replyToToken);
    if (comm && comm.attachments) {
      comm.attachments = JSON.parse(comm.attachments);
    }
    return comm;
  },

  generateReplyToken: (orderId) => {
    // Use first 8 chars of order ID for brevity
    return `ord-${orderId.substring(0, 8)}`;
  },

  parseReplyToken: (toAddress) => {
    // Input: "order-a1b2c3d4@parse.yourdomain.com"
    // Output: "ord-a1b2c3d4"
    const match = toAddress.match(/order-([a-z0-9-]+)@/i);
    return match ? `ord-${match[1]}` : null;
  },

  // Get all message IDs for an order (for email threading)
  getMessageIdsForOrder: (orderId) => {
    const stmt = db.prepare(`
      SELECT messageId FROM order_communications
      WHERE orderId = ? AND messageId IS NOT NULL
      ORDER BY createdAt ASC
    `);
    const rows = stmt.all(orderId);
    return rows.map(row => row.messageId).filter(Boolean);
  },

  // Generate a unique Message-ID for email headers
  generateMessageId: (domain = 'academicamart.com') => {
    const timestamp = Date.now();
    const random = uuidv4().split('-')[0];
    return `<${timestamp}.${random}@${domain}>`;
  },

  // Get unread inbound message count for an order
  getUnreadCount: (orderId) => {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM order_communications
      WHERE orderId = ? AND direction = 'inbound' AND readByAdmin = 0
    `);
    return stmt.get(orderId)?.count || 0;
  },

  // Get unread counts for all orders (for badges)
  getUnreadCountsByOrder: () => {
    const stmt = db.prepare(`
      SELECT orderId, COUNT(*) as count FROM order_communications
      WHERE direction = 'inbound' AND readByAdmin = 0
      GROUP BY orderId
    `);
    const rows = stmt.all();
    const counts = {};
    rows.forEach(row => {
      counts[row.orderId] = row.count;
    });
    return counts;
  },

  // Mark all inbound messages for an order as read
  markAsRead: (orderId) => {
    const stmt = db.prepare(`
      UPDATE order_communications
      SET readByAdmin = 1
      WHERE orderId = ? AND direction = 'inbound' AND readByAdmin = 0
    `);
    stmt.run(orderId);
  },

  // Get recent unread messages (for notifications panel)
  getRecentUnread: (limit = 10) => {
    const stmt = db.prepare(`
      SELECT oc.*, o.orderNumber
      FROM order_communications oc
      JOIN orders o ON oc.orderId = o.id
      WHERE oc.direction = 'inbound' AND oc.readByAdmin = 0
      ORDER BY oc.createdAt DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
};
