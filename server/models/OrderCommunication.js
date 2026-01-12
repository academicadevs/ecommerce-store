import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const OrderCommunication = {
  create: ({ orderId, direction, adminId, senderEmail, recipientEmail, subject, body, replyToToken, attachments }) => {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO order_communications (id, orderId, direction, adminId, senderEmail, recipientEmail, subject, body, replyToToken, attachments)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      attachments ? JSON.stringify(attachments) : null
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
  }
};
