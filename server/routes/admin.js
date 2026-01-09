import express from 'express';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { seedAll } from '../scripts/seedAll.js';

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
    const { filter } = req.query;
    let orders;

    if (filter === 'mine') {
      orders = Order.getByAssignedAdmin(req.user.id);
    } else {
      orders = Order.getAll();
    }

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

    const validStatuses = ['new', 'waiting_feedback', 'in_progress', 'on_hold', 'waiting_signoff', 'sent_to_print', 'completed'];
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

// Assign order to admin
router.put('/orders/:id/assign', (req, res) => {
  try {
    const { adminId } = req.body;

    // adminId can be null to unassign
    if (adminId) {
      const admin = User.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(400).json({ error: 'Invalid admin user' });
      }
    }

    const order = Order.assignTo(req.params.id, adminId || null);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order assigned', order });
  } catch (error) {
    console.error('Error assigning order:', error);
    res.status(500).json({ error: 'Failed to assign order' });
  }
});

// Order notes
router.get('/orders/:id/notes', (req, res) => {
  try {
    const notes = Order.getNotes(req.params.id);
    res.json({ notes });
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

router.post('/orders/:id/notes', (req, res) => {
  try {
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ error: 'Note is required' });
    }

    const newNote = Order.addNote(req.params.id, req.user.id, note.trim());
    res.status(201).json({ message: 'Note added', note: newNote });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

router.delete('/orders/notes/:noteId', (req, res) => {
  try {
    Order.deleteNote(req.params.noteId);
    res.json({ message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// Get all admins (for assignment dropdown)
router.get('/admins', (req, res) => {
  try {
    const users = User.getAll();
    const admins = users.filter(u => u.role === 'admin' || u.userType === 'admin');
    res.json({ admins: admins.map(a => ({ id: a.id, contactName: a.contactName, email: a.email })) });
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
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

router.put('/users/:id/userType', (req, res) => {
  try {
    const { userType } = req.body;

    // Only super admins can change user types
    if (req.user.userType !== 'superadmin') {
      return res.status(403).json({ error: 'Only super admins can change user types' });
    }

    if (!userType || !['school_staff', 'academica_employee', 'admin', 'superadmin'].includes(userType)) {
      return res.status(400).json({ error: 'Valid user type is required' });
    }

    User.updateUserType(req.params.id, userType);

    // Sync role with user type - admin/superadmin userType gets admin role
    const newRole = (userType === 'admin' || userType === 'superadmin') ? 'admin' : 'user';
    User.updateRole(req.params.id, newRole);

    res.json({ message: 'User type updated' });
  } catch (error) {
    console.error('Error updating user type:', error);
    res.status(500).json({ error: 'Failed to update user type' });
  }
});

// Create a new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone } = req.body;

    const validUserTypes = ['school_staff', 'academica_employee', 'admin', 'superadmin'];
    const finalUserType = validUserTypes.includes(userType) ? userType : 'school_staff';
    const isStaffUser = finalUserType === 'school_staff' || finalUserType === 'academica_employee';

    // Validate required fields
    if (!email || !contactName) {
      return res.status(400).json({ error: 'Email and contact name are required' });
    }

    // For staff users, require middle name; for admin users, require password
    if (isStaffUser) {
      if (!middleName || middleName.trim().length < 2) {
        return res.status(400).json({ error: 'Middle name is required for staff users (min 2 characters)' });
      }
    } else {
      if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password is required for admin users (min 6 characters)' });
      }
    }

    // Check if user already exists
    const existing = User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    // Only superadmins can create admin/superadmin users
    if ((finalUserType === 'admin' || finalUserType === 'superadmin') && req.user.userType !== 'superadmin') {
      return res.status(403).json({ error: 'Only super admins can create admin users' });
    }

    const user = await User.create({
      email,
      password,
      userType: finalUserType,
      contactName,
      middleName,
      positionTitle,
      department,
      schoolName,
      principalName,
      phone
    });

    // Set role based on userType
    if (finalUserType === 'admin' || finalUserType === 'superadmin') {
      User.updateRole(user.id, 'admin');
    }

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user profile (admin can edit all except superadmins, superadmin can edit all)
router.put('/users/:id', async (req, res) => {
  try {
    const targetUser = User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Admins cannot edit superadmin profiles
    if (targetUser.userType === 'superadmin' && req.user.userType !== 'superadmin') {
      return res.status(403).json({ error: 'You do not have permission to edit super admin profiles' });
    }

    const { contactName, middleName, positionTitle, department, schoolName, principalName, phone, email } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== targetUser.email) {
      const existing = User.findByEmail(email);
      if (existing) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }
    }

    // For staff users, if middle name is changed, update password too
    const isStaffUser = targetUser.userType === 'school_staff' || targetUser.userType === 'academica_employee';
    if (isStaffUser && middleName && middleName !== targetUser.middleName) {
      if (middleName.trim().length < 2) {
        return res.status(400).json({ error: 'Middle name must be at least 2 characters' });
      }
      await User.updateMiddleNameAndPassword(req.params.id, middleName);
    }

    const updatedUser = User.updateProfile(req.params.id, {
      contactName,
      middleName: isStaffUser ? middleName : targetUser.middleName,
      positionTitle,
      department,
      schoolName,
      principalName,
      phone,
      email
    });

    res.json({ message: 'User profile updated', user: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// Reset user password (only for admin/superadmin users, and only superadmins can do this)
router.put('/users/:id/password', async (req, res) => {
  try {
    const targetUser = User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Staff users don't use this endpoint - their password is their middle name
    const isStaffUser = targetUser.userType === 'school_staff' || targetUser.userType === 'academica_employee';
    if (isStaffUser) {
      return res.status(400).json({ error: 'Staff user passwords are managed through their middle name in profile settings' });
    }

    // Only superadmins can change admin/superadmin passwords
    if (req.user.userType !== 'superadmin') {
      return res.status(403).json({ error: 'Only super admins can change admin passwords' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await User.updatePassword(req.params.id, password);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: 'Failed to reset password' });
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

// Seed dummy data (superadmin only, one-time use)
router.post('/seed', async (req, res) => {
  try {
    // Only superadmins can seed data
    if (req.user.userType !== 'superadmin') {
      return res.status(403).json({ error: 'Only super admins can seed data' });
    }

    console.log('Manual seed triggered by:', req.user.email);
    await seedAll();
    res.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

export default router;
