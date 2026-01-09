import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Order = {
  create: ({ userId, items, total, shippingInfo, notes }) => {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO orders (id, userId, items, total, shippingInfo, notes, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      JSON.stringify(items),
      total,
      JSON.stringify(shippingInfo),
      notes || null,
      'pending',
      now
    );

    return {
      id,
      userId,
      items,
      total,
      shippingInfo,
      notes,
      status: 'pending',
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
      SELECT o.*, u.email, u.schoolName
      FROM orders o
      JOIN users u ON o.userId = u.id
      ORDER BY o.createdAt DESC
    `);

    const orders = stmt.all();

    return orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
      shippingInfo: JSON.parse(order.shippingInfo)
    }));
  },

  updateStatus: (id, status) => {
    const stmt = db.prepare('UPDATE orders SET status = ? WHERE id = ?');
    stmt.run(status, id);

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
  }
};
