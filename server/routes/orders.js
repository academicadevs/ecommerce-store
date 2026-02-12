import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { User } from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// --- File Attachment Upload ---

const attachmentsDir = path.join(
  process.env.UPLOADS_PATH || path.join(__dirname, '../uploads'),
  'attachments'
);

// Ensure directory exists
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, attachmentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueId}${ext}`);
  }
});

const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 250 * 1024 * 1024 }, // 250MB per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, PDF, Word, Excel, PowerPoint'));
    }
  }
});

// Upload attachments (no auth required — guests can attach files)
router.post('/attachments', attachmentUpload.array('files', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      type: file.mimetype,
      url: `/uploads/attachments/${file.filename}`,
    }));

    res.json({ attachments });
  } catch (error) {
    console.error('Error uploading attachments:', error);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// Multer error handler for attachment uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 250MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5.' });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

// Guest order creation (no auth required) — must be before authenticate middleware
router.post('/guest', async (req, res) => {
  try {
    const { guestInfo, customRequestData } = req.body;

    if (!guestInfo?.contactName || !guestInfo?.email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Create or reuse guest user
    const guestUser = await User.createGuest({
      email: guestInfo.email,
      contactName: guestInfo.contactName,
      phone: guestInfo.phone,
      schoolName: guestInfo.schoolName,
    });

    // Build order items matching the custom request pattern
    const orderItems = [{
      productId: null,
      name: customRequestData?.projectTitle || 'Quick Request',
      price: 0,
      quantity: 1,
      selectedOptions: customRequestData || null,
      isSpecialRequest: true,
      requestType: 'custom'
    }];

    const order = Order.create({
      userId: guestUser.id,
      items: orderItems,
      total: 0,
      shippingInfo: {
        schoolName: guestInfo.schoolName || 'N/A',
        contactName: guestInfo.contactName,
        email: guestInfo.email,
        phone: guestInfo.phone || '',
      },
      notes: null
    });

    res.status(201).json({
      message: 'Request submitted successfully',
      order
    });

    // Send confirmation email (fire-and-forget so response isn't blocked)
    sendOrderConfirmationEmail(order, guestUser).catch(emailError => {
      console.error('Failed to send guest order email:', emailError);
    });
  } catch (error) {
    console.error('Error creating guest order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// All remaining order routes require authentication
router.use(authenticate);

// Create a new order (checkout)
router.post('/', async (req, res) => {
  try {
    const { shippingInfo, notes, isCustomRequest, isMetaAdsCampaign, customRequestData, onBehalfOfUserId } = req.body;

    // For custom requests and meta ads campaigns, cart can be empty
    const isSpecialRequest = isCustomRequest || isMetaAdsCampaign;

    // Validate school/contact info (relaxed for special requests and admin orders)
    if (!shippingInfo) {
      return res.status(400).json({ error: 'Contact information is required' });
    }
    if (!shippingInfo.email && req.user.role !== 'admin') {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Determine the user ID for the order
    // Admins can create orders on behalf of other users
    let orderUserId = req.user.id;
    if (onBehalfOfUserId && req.user.role === 'admin') {
      orderUserId = onBehalfOfUserId;
    }

    let orderItems = [];
    let total = 0;

    if (!isSpecialRequest) {
      // Regular order - get cart items
      const cartItems = Cart.getByUserId(req.user.id);

      if (cartItems.length === 0) {
        return res.status(400).json({ error: 'Cart is empty' });
      }

      // Calculate total
      total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Format items for order - include all configurator data
      orderItems = cartItems.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedOptions: item.selectedOptions || null
      }));
    } else {
      // Special request - create item with structured request data
      const requestType = isMetaAdsCampaign ? 'Digital Ad Campaign Request' : 'Custom Request';
      const { customRequestData } = req.body;

      orderItems = [{
        productId: null,
        name: customRequestData?.projectTitle || customRequestData?.campaignName || requestType,
        price: 0,
        quantity: 1,
        selectedOptions: customRequestData || null,
        isSpecialRequest: true,
        requestType: isMetaAdsCampaign ? 'meta-ads' : 'custom'
      }];
    }

    // Create order
    const order = Order.create({
      userId: orderUserId,
      items: orderItems,
      total,
      shippingInfo,
      notes
    });

    // Clear cart only for regular orders
    if (!isSpecialRequest) {
      Cart.clear(req.user.id);
    }

    res.status(201).json({
      message: 'Request submitted successfully',
      order
    });

    // Send confirmation emails (fire-and-forget so response isn't blocked)
    sendOrderConfirmationEmail(order, req.user).catch(emailError => {
      console.error('Failed to send order email:', emailError);
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get user's orders
router.get('/', (req, res) => {
  try {
    const orders = Order.getByUserId(req.user.id);
    res.json({ orders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/:id', (req, res) => {
  try {
    const order = Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Ensure user can only see their own orders (unless admin)
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
