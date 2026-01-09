import db from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

export const Cart = {
  getByUserId: (userId) => {
    const stmt = db.prepare(`
      SELECT ci.id, ci.productId, ci.quantity, ci.selectedOptions, ci.calculatedPrice,
             p.name, p.priceMin, p.priceMax, p.imageUrl, p.inStock, p.options
      FROM cart_items ci
      JOIN products p ON ci.productId = p.id
      WHERE ci.userId = ?
    `);

    const items = stmt.all(userId);
    return items.map(item => ({
      ...item,
      inStock: Boolean(item.inStock),
      selectedOptions: item.selectedOptions ? JSON.parse(item.selectedOptions) : null,
      productOptions: item.options ? JSON.parse(item.options) : null,
      // Use calculated price if set, otherwise use priceMin
      price: item.calculatedPrice || item.priceMin
    }));
  },

  addItem: (userId, productId, quantity = 1, selectedOptions = null, calculatedPrice = null) => {
    const id = uuidv4();

    db.prepare(
      `INSERT INTO cart_items (id, userId, productId, quantity, selectedOptions, calculatedPrice)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, userId, productId, quantity,
          selectedOptions ? JSON.stringify(selectedOptions) : null,
          calculatedPrice);

    return Cart.getByUserId(userId);
  },

  updateItem: (userId, itemId, quantity, selectedOptions = null, calculatedPrice = null) => {
    if (quantity <= 0) {
      return Cart.removeItem(userId, itemId);
    }

    const updates = ['quantity = ?'];
    const params = [quantity];

    if (selectedOptions !== null) {
      updates.push('selectedOptions = ?');
      params.push(JSON.stringify(selectedOptions));
    }

    if (calculatedPrice !== null) {
      updates.push('calculatedPrice = ?');
      params.push(calculatedPrice);
    }

    params.push(itemId, userId);

    db.prepare(
      `UPDATE cart_items SET ${updates.join(', ')} WHERE id = ? AND userId = ?`
    ).run(...params);

    return Cart.getByUserId(userId);
  },

  updateQuantity: (userId, itemId, quantity) => {
    if (quantity <= 0) {
      return Cart.removeItem(userId, itemId);
    }

    db.prepare(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND userId = ?'
    ).run(quantity, itemId, userId);

    return Cart.getByUserId(userId);
  },

  removeItem: (userId, itemId) => {
    db.prepare(
      'DELETE FROM cart_items WHERE id = ? AND userId = ?'
    ).run(itemId, userId);

    return Cart.getByUserId(userId);
  },

  clear: (userId) => {
    db.prepare('DELETE FROM cart_items WHERE userId = ?').run(userId);
  },

  getItemCount: (userId) => {
    const result = db.prepare(
      'SELECT SUM(quantity) as count FROM cart_items WHERE userId = ?'
    ).get(userId);

    return result.count || 0;
  }
};
