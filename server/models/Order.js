import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Order = {
  // Generate order number in format XXXX-MMDDYY-NNN
  // XXXX = First 2 chars of first name + First 2 chars of last name
  // MMDDYY = Date
  // NNN = Sequential number for that day
  generateOrderNumber: (contactName, date = new Date()) => {
    // Generate name prefix (first 2 of first name + first 2 of last name)
    const nameParts = (contactName || 'Unknown User').trim().split(/\s+/);
    const firstName = nameParts[0] || 'XX';
    const lastName = nameParts[nameParts.length - 1] || 'XX';
    const namePrefix = (firstName.substring(0, 2) + lastName.substring(0, 2)).toUpperCase();

    // Generate date string MMDDYY
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2);
    const dateStr = `${month}${day}${year}`;

    // Get count of orders for this date to determine sequence
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE createdAt >= ? AND createdAt <= ?
    `);
    const result = stmt.get(dayStart.toISOString(), dayEnd.toISOString());
    const sequenceNum = (result?.count || 0) + 1;

    return `${namePrefix}-${dateStr}-${sequenceNum.toString().padStart(3, '0')}`;
  },

  create: ({ userId, items, total, shippingInfo, notes }) => {
    const id = uuidv4();
    const contactName = shippingInfo?.contactName || 'Unknown User';
    const orderNumber = Order.generateOrderNumber(contactName);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO orders (id, orderNumber, userId, items, total, shippingInfo, notes, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      orderNumber,
      userId,
      JSON.stringify(items),
      total,
      JSON.stringify(shippingInfo),
      notes || null,
      'new',
      now
    );

    return {
      id,
      orderNumber,
      userId,
      items,
      total,
      shippingInfo,
      notes,
      status: 'new',
      createdAt: now
    };
  },

  findById: (id) => {
    const stmt = db.prepare('SELECT * FROM orders WHERE id = ?');
    const order = stmt.get(id);

    if (order) {
      order.items = JSON.parse(order.items);
      order.shippingInfo = JSON.parse(order.shippingInfo);
    }

    return order;
  },

  getByUserId: (userId) => {
    const stmt = db.prepare('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC');
    const orders = stmt.all(userId);

    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      shippingInfo: JSON.parse(order.shippingInfo)
    }));
  },

  getAll: () => {
    const stmt = db.prepare(`
      SELECT o.*, u.email, u.schoolName,
             a.contactName as assignedToName, a.email as assignedToEmail
      FROM orders o
      JOIN users u ON o.userId = u.id
      LEFT JOIN users a ON o.assignedTo = a.id
      ORDER BY o.createdAt DESC
    `);

    const orders = stmt.all();

    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      shippingInfo: JSON.parse(order.shippingInfo)
    }));
  },

  getByAssignedAdmin: (adminId) => {
    const stmt = db.prepare(`
      SELECT o.*, u.email, u.schoolName,
             a.contactName as assignedToName, a.email as assignedToEmail
      FROM orders o
      JOIN users u ON o.userId = u.id
      LEFT JOIN users a ON o.assignedTo = a.id
      WHERE o.assignedTo = ?
      ORDER BY o.createdAt DESC
    `);

    const orders = stmt.all(adminId);

    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      shippingInfo: JSON.parse(order.shippingInfo)
    }));
  },

  assignTo: (orderId, adminId) => {
    const stmt = db.prepare('UPDATE orders SET assignedTo = ? WHERE id = ?');
    stmt.run(adminId, orderId);
    return Order.findById(orderId);
  },

  updateStatus: (id, status) => {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(status, id);

    return Order.findById(id);
  },

  updateItems: (id, items) => {
    // Recalculate total based on items
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const stmt = db.prepare('UPDATE orders SET items = ?, total = ? WHERE id = ?');
    stmt.run(JSON.stringify(items), total, id);

    return Order.findById(id);
  },

  updateShippingInfo: (id, updatedFields) => {
    const order = Order.findById(id);
    if (!order) return null;

    const shippingInfo = { ...order.shippingInfo, ...updatedFields };

    const stmt = db.prepare('UPDATE orders SET shippingInfo = ? WHERE id = ?');
    stmt.run(JSON.stringify(shippingInfo), id);

    return Order.findById(id);
  },

  updateUserId: (id, userId) => {
    const stmt = db.prepare('UPDATE orders SET userId = ? WHERE id = ?');
    stmt.run(userId, id);
    return Order.findById(id);
  },

  updateAdditionalEmails: (id, additionalEmails) => {
    const order = Order.findById(id);
    if (!order) return null;

    const shippingInfo = order.shippingInfo || {};
    shippingInfo.additionalEmails = additionalEmails;

    const stmt = db.prepare('UPDATE orders SET shippingInfo = ? WHERE id = ?');
    stmt.run(JSON.stringify(shippingInfo), id);

    return Order.findById(id);
  },

  count: () => {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM orders');
    return stmt.get().count;
  },

  getTotalRevenue: () => {
    const stmt = db.prepare('SELECT SUM(total) as total FROM orders');
    const result = stmt.get();
    return result.total || 0;
  },

  getRecentOrders: (limit = 5) => {
    const stmt = db.prepare(`
      SELECT o.*, u.email, u.schoolName
      FROM orders o
      JOIN users u ON o.userId = u.id
      ORDER BY o.createdAt DESC
      LIMIT ?
    `);

    const orders = stmt.all(limit);

    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      shippingInfo: JSON.parse(order.shippingInfo)
    }));
  },

  // Order Notes methods
  addNote: (orderId, adminId, note) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO order_notes (id, orderId, adminId, note, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, orderId, adminId, note, now);

    return { id, orderId, adminId, note, createdAt: now };
  },

  getNotes: (orderId) => {
    const stmt = db.prepare(`
      SELECT n.*, u.contactName as adminName, u.email as adminEmail
      FROM order_notes n
      JOIN users u ON n.adminId = u.id
      WHERE n.orderId = ?
      ORDER BY n.createdAt DESC
    `);

    return stmt.all(orderId);
  },

  deleteNote: (noteId) => {
    const stmt = db.prepare('DELETE FROM order_notes WHERE id = ?');
    stmt.run(noteId);
  }
};
