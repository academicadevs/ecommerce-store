import express from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All cart routes require authentication
router.use(authenticate);

// Get user's cart
router.get('/', (req, res) => {
  try {
    const items = Cart.getByUserId(req.user.id);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ items, total });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add item to cart
router.post('/', (req, res) => {
  try {
    const { productId, quantity = 1, selectedOptions = null, calculatedPrice = null } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Verify product exists
    const product = Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.inStock) {
      return res.status(400).json({ error: 'Product is out of stock' });
    }

    // Use provided calculated price or default to priceMin
    const finalPrice = calculatedPrice || product.priceMin;

    const items = Cart.addItem(req.user.id, productId, quantity, selectedOptions, finalPrice);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ message: 'Item added to cart', items, total });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
});

// Update cart item
router.put('/:itemId', (req, res) => {
  try {
    const { quantity, selectedOptions, calculatedPrice } = req.body;

    if (quantity !== undefined && quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    let items;
    if (selectedOptions !== undefined || calculatedPrice !== undefined) {
      items = Cart.updateItem(req.user.id, req.params.itemId, quantity || 1, selectedOptions, calculatedPrice);
    } else {
      items = Cart.updateQuantity(req.user.id, req.params.itemId, quantity);
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ message: 'Cart updated', items, total });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item from cart
router.delete('/:itemId', (req, res) => {
  try {
    const items = Cart.removeItem(req.user.id, req.params.itemId);
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    res.json({ message: 'Item removed from cart', items, total });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
});

// Clear cart
router.delete('/', (req, res) => {
  try {
    Cart.clear(req.user.id);
    res.json({ message: 'Cart cleared', items: [], total: 0 });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
