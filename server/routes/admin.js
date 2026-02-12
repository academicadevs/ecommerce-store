import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { OrderCommunication } from '../models/OrderCommunication.js';
import { Proof, ProofAnnotation } from '../models/Proof.js';
import { User } from '../models/User.js';
import { School } from '../models/School.js';
import { Office } from '../models/Office.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { seedAll } from '../scripts/seedAll.js';
import { sendOrderEmail } from '../utils/sendgrid.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Configure multer for product images
const productUploadsDir = path.join(
  process.env.UPLOADS_PATH || path.join(__dirname, '../uploads'),
  'products'
);

const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const productImageUpload = multer({
  storage: productStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const mimeOk = /^image\/(jpeg|png|gif|webp)$/.test(file.mimetype);
    if (allowedTypes.test(ext) && mimeOk) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
    }
  }
});

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

// Notifications - unread counts for all orders (for badges)
router.get('/notifications/unread-counts', (req, res) => {
  try {
    const messageCounts = OrderCommunication.getUnreadCountsByOrder();
    const feedbackCounts = ProofAnnotation.getUnreadCountsByOrder();

    // Merge counts by order
    const allOrderIds = new Set([...Object.keys(messageCounts), ...Object.keys(feedbackCounts)]);
    const counts = {};
    allOrderIds.forEach(orderId => {
      counts[orderId] = {
        messages: messageCounts[orderId] || 0,
        feedback: feedbackCounts[orderId] || 0,
        total: (messageCounts[orderId] || 0) + (feedbackCounts[orderId] || 0)
      };
    });

    res.json({ counts });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    res.status(500).json({ error: 'Failed to fetch unread counts' });
  }
});

// Notifications - recent unread items (for dashboard panel)
router.get('/notifications/recent', (req, res) => {
  try {
    const recentMessages = OrderCommunication.getRecentUnread(10);
    const recentFeedback = ProofAnnotation.getRecentUnread(10);

    // Combine and sort by date
    const notifications = [
      ...recentMessages.map(msg => ({
        id: msg.id,
        type: 'message',
        orderId: msg.orderId,
        orderNumber: msg.orderNumber,
        subject: msg.subject,
        body: msg.body?.substring(0, 100) + (msg.body?.length > 100 ? '...' : ''),
        senderEmail: msg.senderEmail,
        createdAt: msg.createdAt
      })),
      ...recentFeedback.map(fb => ({
        id: fb.id,
        type: 'feedback',
        orderId: fb.orderId,
        orderNumber: fb.orderNumber,
        proofTitle: fb.proofTitle,
        proofVersion: fb.proofVersion,
        comment: fb.comment?.substring(0, 100) + (fb.comment?.length > 100 ? '...' : ''),
        authorName: fb.authorName,
        createdAt: fb.createdAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 15);

    const totalUnread = {
      messages: recentMessages.length,
      feedback: recentFeedback.length
    };

    res.json({ notifications, totalUnread });
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark notifications as read for an order
router.post('/notifications/mark-read/:orderId', (req, res) => {
  try {
    const { orderId } = req.params;

    // Mark both messages and feedback as read
    OrderCommunication.markAsRead(orderId);
    ProofAnnotation.markAsReadByOrder(orderId);

    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
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

// Reorder products (must be before :id routes)
router.put('/products/reorder', (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds must be a non-empty array' });
    }

    Product.reorder(productIds);
    res.json({ message: 'Products reordered successfully' });
  } catch (error) {
    console.error('Error reordering products:', error);
    res.status(500).json({ error: 'Failed to reorder products' });
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
    const { name, description, priceMin, priceMax, category, subcategory, imageUrl, images, options, features, inStock } = req.body;

    const existing = Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = Product.update(req.params.id, {
      name: name || existing.name,
      description: description !== undefined ? description : existing.description,
      priceMin: priceMin !== undefined ? priceMin : existing.priceMin,
      priceMax: priceMax !== undefined ? priceMax : existing.priceMax,
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

// Product image upload
router.post('/products/:id/images', productImageUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const product = Product.findById(req.params.id);
    if (!product) {
      // Delete uploaded file since product doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check image count limit (max 8)
    const currentImages = product.images || [];
    if (currentImages.length >= 8) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Maximum 8 images allowed per product' });
    }

    const imageData = {
      url: `/uploads/products/${req.file.filename}`,
      filename: req.file.originalname,
      uploaded: true
    };

    const updatedImages = [...currentImages, imageData];
    const updatedProduct = Product.update(req.params.id, {
      ...product,
      images: updatedImages
    });

    res.json({
      message: 'Image uploaded successfully',
      image: imageData,
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error uploading product image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Reorder product images
router.put('/products/:id/images/reorder', (req, res) => {
  try {
    const { images } = req.body;

    if (!Array.isArray(images)) {
      return res.status(400).json({ error: 'Images must be an array' });
    }

    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = Product.update(req.params.id, {
      ...product,
      images: images
    });

    res.json({ message: 'Images reordered', product: updatedProduct });
  } catch (error) {
    console.error('Error reordering images:', error);
    res.status(500).json({ error: 'Failed to reorder images' });
  }
});

// Delete product image
router.delete('/products/:id/images/:imageIndex', (req, res) => {
  try {
    const product = Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const imageIndex = parseInt(req.params.imageIndex, 10);
    const images = product.images || [];

    if (imageIndex < 0 || imageIndex >= images.length) {
      return res.status(400).json({ error: 'Invalid image index' });
    }

    const imageToDelete = images[imageIndex];

    // Delete file from disk if it was an uploaded file
    if (imageToDelete && typeof imageToDelete === 'object' && imageToDelete.uploaded) {
      const filePath = path.join(
        process.env.UPLOADS_PATH || path.join(__dirname, '../uploads'),
        'products',
        path.basename(imageToDelete.url)
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove from array
    const updatedImages = images.filter((_, idx) => idx !== imageIndex);
    const updatedProduct = Product.update(req.params.id, {
      ...product,
      images: updatedImages
    });

    res.json({ message: 'Image deleted', product: updatedProduct });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
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

// Get single order
router.get('/orders/:id', (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

router.put('/orders/:id', (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['new', 'waiting_feedback', 'in_progress', 'submitted_to_kimp360', 'waiting_signoff', 'sent_to_print', 'completed', 'on_hold'];
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

// Update additional emails (CC recipients)
router.put('/orders/:id/cc-emails', (req, res) => {
  try {
    const { additionalEmails } = req.body;

    if (!Array.isArray(additionalEmails)) {
      return res.status(400).json({ error: 'additionalEmails must be an array' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = additionalEmails.filter(email => emailRegex.test(email));

    const order = Order.updateAdditionalEmails(req.params.id, validEmails);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'CC emails updated', order });
  } catch (error) {
    console.error('Error updating CC emails:', error);
    res.status(500).json({ error: 'Failed to update CC emails' });
  }
});

// Update shipping info (customer information)
router.put('/orders/:id/shipping-info', (req, res) => {
  try {
    const { shippingInfo, userId } = req.body;

    if (!shippingInfo || typeof shippingInfo !== 'object') {
      return res.status(400).json({ error: 'shippingInfo must be an object' });
    }

    // If userId is provided, validate the user exists and update the order's user link
    if (userId) {
      const linkedUser = User.findById(userId);
      if (!linkedUser) {
        return res.status(400).json({ error: 'Selected user not found' });
      }
      Order.updateUserId(req.params.id, userId);
    }

    const order = Order.updateShippingInfo(req.params.id, shippingInfo);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Shipping info updated', order });
  } catch (error) {
    console.error('Error updating shipping info:', error);
    res.status(500).json({ error: 'Failed to update shipping info' });
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

// Update order items
router.put('/orders/:id/items', (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = Order.updateItems(req.params.id, items);
    res.json({ message: 'Order items updated', order: updatedOrder });
  } catch (error) {
    console.error('Error updating order items:', error);
    res.status(500).json({ error: 'Failed to update order items' });
  }
});

// Order communications
router.get('/orders/:id/communications', (req, res) => {
  try {
    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const communications = OrderCommunication.getByOrderId(req.params.id);
    res.json({ communications });
  } catch (error) {
    console.error('Error fetching communications:', error);
    res.status(500).json({ error: 'Failed to fetch communications' });
  }
});

// Send email to customer (with attachments)
router.post('/orders/:id/email', upload.array('attachments', 10), async (req, res) => {
  try {
    const { subject, body, includeOrderDetails } = req.body;

    if (!subject || !body) {
      return res.status(400).json({ error: 'Subject and body are required' });
    }

    const order = Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get customer email from shippingInfo
    const customerEmail = order.shippingInfo?.email;
    if (!customerEmail) {
      return res.status(400).json({ error: 'Customer email not found in order' });
    }

    // Process uploaded files
    const attachments = req.files?.map(file => ({
      id: path.basename(file.filename, path.extname(file.filename)),
      filename: file.originalname,
      storedName: file.filename,
      type: file.mimetype,
      size: file.size,
      path: `/api/admin/attachments/${file.filename}`
    })) || [];

    // Generate reply token for routing inbound emails
    const replyToToken = OrderCommunication.generateReplyToken(req.params.id);

    // Get previous message IDs for email threading
    const threadMessageIds = OrderCommunication.getMessageIdsForOrder(req.params.id);

    // Send email via SendGrid
    const emailResult = await sendOrderEmail({
      to: customerEmail,
      subject,
      body,
      order,
      replyToToken,
      attachments: req.files,
      includeOrderDetails: includeOrderDetails !== 'false',
      threadMessageIds
    });

    if (!emailResult.success) {
      return res.status(500).json({ error: emailResult.error || 'Failed to send email' });
    }

    // Record the communication with attachments and message ID
    const communication = OrderCommunication.create({
      orderId: req.params.id,
      direction: 'outbound',
      adminId: req.user.id,
      senderEmail: emailResult.from,
      recipientEmail: customerEmail,
      subject,
      body,
      replyToToken,
      attachments: attachments.length > 0 ? attachments : null,
      messageId: emailResult.messageId
    });

    res.json({ message: 'Email sent', communication });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Serve attachments
router.get('/attachments/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Error serving attachment:', error);
    res.status(404).json({ error: 'Attachment not found' });
  }
});

// Download attachment
router.get('/attachments/:filename/download', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads', filename);
    res.download(filePath);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(404).json({ error: 'Attachment not found' });
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

// Quick-create a user (admin only) - only name required
router.post('/users/quick', async (req, res) => {
  try {
    const { contactName, email, phone, schoolName } = req.body;

    if (!contactName?.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (email) {
      const existing = User.findByEmail(email);
      if (existing) {
        return res.json({ message: 'Existing user found', user: existing });
      }
    }

    const user = await User.createQuickUser({
      contactName: contactName.trim(),
      email,
      phone,
      schoolName,
    });

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.error('Error creating quick user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Create a new user (admin only)
router.post('/users', async (req, res) => {
  try {
    const { email, password, userType, contactName, middleName, positionTitle, department, schoolName, principalName, phone, school_id, supervisor, office_id } = req.body;

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
      phone,
      school_id,
      supervisor,
      office_id
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

    const { contactName, middleName, positionTitle, department, schoolName, principalName, phone, email, school_id, supervisor, office_id } = req.body;

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
      email,
      school_id,
      supervisor,
      office_id
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

// School management

// Get all schools with user counts
router.get('/schools', (req, res) => {
  try {
    const schools = School.getAllWithUserCounts();
    res.json({ schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Get a single school
router.get('/schools/:id', (req, res) => {
  try {
    const school = School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json({ school });
  } catch (error) {
    console.error('Error fetching school:', error);
    res.status(500).json({ error: 'Failed to fetch school' });
  }
});

// Create a new school
router.post('/schools', (req, res) => {
  try {
    const { name, principal_name, address, city, state, zip, phone, email, district, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'School name is required' });
    }

    // Check if school name already exists
    const existing = School.findByName(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'A school with this name already exists' });
    }

    const school = School.create({
      name: name.trim(),
      principal_name,
      address,
      city,
      state,
      zip,
      phone,
      email,
      district,
      is_active: is_active !== false
    });

    res.status(201).json({ message: 'School created', school });
  } catch (error) {
    console.error('Error creating school:', error);
    res.status(500).json({ error: 'Failed to create school' });
  }
});

// Update a school
router.put('/schools/:id', (req, res) => {
  try {
    const existing = School.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'School not found' });
    }

    const { name, principal_name, address, city, state, zip, phone, email, district, is_active } = req.body;

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existing.name) {
      const duplicate = School.findByName(name.trim());
      if (duplicate && duplicate.id !== req.params.id) {
        return res.status(400).json({ error: 'A school with this name already exists' });
      }
    }

    const school = School.update(req.params.id, {
      name: name ? name.trim() : undefined,
      principal_name,
      address,
      city,
      state,
      zip,
      phone,
      email,
      district,
      is_active
    });

    res.json({ message: 'School updated', school });
  } catch (error) {
    console.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// Toggle school active status
router.put('/schools/:id/toggle-active', (req, res) => {
  try {
    const school = School.toggleActive(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }
    res.json({ message: `School ${school.is_active ? 'activated' : 'deactivated'}`, school });
  } catch (error) {
    console.error('Error toggling school status:', error);
    res.status(500).json({ error: 'Failed to toggle school status' });
  }
});

// Delete a school (only if no users assigned)
router.delete('/schools/:id', (req, res) => {
  try {
    const school = School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Check if any users are assigned to this school
    const users = School.getSchoolUsers(req.params.id);
    if (users.length > 0) {
      return res.status(400).json({
        error: `Cannot delete school with ${users.length} assigned user(s). Please reassign or remove users first.`
      });
    }

    School.delete(req.params.id);
    res.json({ message: 'School deleted' });
  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ error: 'Failed to delete school' });
  }
});

// Get users assigned to a school
router.get('/schools/:id/users', (req, res) => {
  try {
    const school = School.findById(req.params.id);
    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    const users = School.getSchoolUsers(req.params.id);
    res.json({ users, school });
  } catch (error) {
    console.error('Error fetching school users:', error);
    res.status(500).json({ error: 'Failed to fetch school users' });
  }
});

// Office management

// Get all offices with user counts
router.get('/offices', (req, res) => {
  try {
    const offices = Office.getAllWithUserCounts();
    res.json({ offices });
  } catch (error) {
    console.error('Error fetching offices:', error);
    res.status(500).json({ error: 'Failed to fetch offices' });
  }
});

// Get a single office
router.get('/offices/:id', (req, res) => {
  try {
    const office = Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }
    res.json({ office });
  } catch (error) {
    console.error('Error fetching office:', error);
    res.status(500).json({ error: 'Failed to fetch office' });
  }
});

// Create a new office
router.post('/offices', (req, res) => {
  try {
    const { name, address, city, state, zip, phone, email, is_active } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Office name is required' });
    }

    // Check if office name already exists
    const existing = Office.findByName(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'An office with this name already exists' });
    }

    const office = Office.create({
      name: name.trim(),
      address,
      city,
      state,
      zip,
      phone,
      email,
      is_active: is_active !== false
    });

    res.status(201).json({ message: 'Office created', office });
  } catch (error) {
    console.error('Error creating office:', error);
    res.status(500).json({ error: 'Failed to create office' });
  }
});

// Update an office
router.put('/offices/:id', (req, res) => {
  try {
    const existing = Office.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Office not found' });
    }

    const { name, address, city, state, zip, phone, email, is_active } = req.body;

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existing.name) {
      const duplicate = Office.findByName(name.trim());
      if (duplicate && duplicate.id !== req.params.id) {
        return res.status(400).json({ error: 'An office with this name already exists' });
      }
    }

    const office = Office.update(req.params.id, {
      name: name ? name.trim() : undefined,
      address,
      city,
      state,
      zip,
      phone,
      email,
      is_active
    });

    res.json({ message: 'Office updated', office });
  } catch (error) {
    console.error('Error updating office:', error);
    res.status(500).json({ error: 'Failed to update office' });
  }
});

// Toggle office active status
router.put('/offices/:id/toggle-active', (req, res) => {
  try {
    const office = Office.toggleActive(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }
    res.json({ message: `Office ${office.is_active ? 'activated' : 'deactivated'}`, office });
  } catch (error) {
    console.error('Error toggling office status:', error);
    res.status(500).json({ error: 'Failed to toggle office status' });
  }
});

// Delete an office (only if no users assigned)
router.delete('/offices/:id', (req, res) => {
  try {
    const office = Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    // Check if any users are assigned to this office
    const users = Office.getOfficeUsers(req.params.id);
    if (users.length > 0) {
      return res.status(400).json({
        error: `Cannot delete office with ${users.length} assigned user(s). Please reassign or remove users first.`
      });
    }

    Office.delete(req.params.id);
    res.json({ message: 'Office deleted' });
  } catch (error) {
    console.error('Error deleting office:', error);
    res.status(500).json({ error: 'Failed to delete office' });
  }
});

// Get users assigned to an office
router.get('/offices/:id/users', (req, res) => {
  try {
    const office = Office.findById(req.params.id);
    if (!office) {
      return res.status(404).json({ error: 'Office not found' });
    }

    const users = Office.getOfficeUsers(req.params.id);
    res.json({ users, office });
  } catch (error) {
    console.error('Error fetching office users:', error);
    res.status(500).json({ error: 'Failed to fetch office users' });
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
