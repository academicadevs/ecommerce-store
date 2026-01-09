import express from 'express';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalProducts: Product.count(),
      totalOrders: Order.count(),
      totalUsers: User.count(),
      totalRevenue: Order.getTotalRevenue(),
      recentOrders: Order.getRecentOrders(5)
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Product management
router.get('/products', (req, res) => {
  try {
    const products = Product.getAll();
    res.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

router.post('/products', (req, res) => {
  try {
    const { name, description, category, subcategory, imageUrl, images, options, features, inStock } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    const product = Product.create({
      name,
      description,
      category,
      subcategory,
      imageUrl,
      images,
      options,
      features,
      inStock
    });
    res.status(201).json({ message: 'Product created', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/products/:id', (req, res) => {
  try {
    const { name, description, category, subcategory, imageUrl, images, options, features, inStock } = req.body;

    const existing = Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = Product.update(req.params.id, {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      category: category || existing.category,
      subcategory: subcategory !== undefined ? subcategory : existing.subcategory,
      imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
      images: images !== undefined ? images : existing.images,
      options: options !== undefined ? options : existing.options,
      features: features !== undefined ? features : existing.features,
      inStock: inStock !== undefined ? inStock : existing.inStock
    });

    res.json({ message: 'Product updated', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/products/:id', (req, res) => {
  try {
    const existing = Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    Product.delete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Order management
router.get('/orders', (req, res) => {
  try {
    const orders = Order.getAll();
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.put('/orders/:id', (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = Order.updateStatus(req.params.id, status);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order updated', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// User management
router.get('/users', (req, res) => {
  try {
    const users = User.getAll();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.put('/users/:id/role', (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    User.updateRole(req.params.id, role);
    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Get orders for a specific user
router.get('/users/:id/orders', (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const orders = Order.getByUserId(req.params.id);
    res.json({ orders, user: { id: user.id, email: user.email, schoolName: user.schoolName, contactName: user.contactName } });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Failed to fetch user orders' });
  }
});

export default router;
