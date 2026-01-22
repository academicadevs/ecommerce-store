import express from 'express';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { authenticate } from '../middleware/auth.js';
import { sendOrderConfirmationEmail } from '../utils/email.js';

const router = express.Router();

// All order routes require authentication
router.use(authenticate);

// Create a new order (checkout)
router.post('/', async (req, res) => {
  try {
    const { shippingInfo, notes, isCustomRequest, isMetaAdsCampaign, customRequestData, onBehalfOfUserId } = req.body;

    // For custom requests and meta ads campaigns, cart can be empty
    const isSpecialRequest = isCustomRequest || isMetaAdsCampaign;

    // Validate school/contact info (relaxed for special requests)
    if (!shippingInfo || !shippingInfo.email) {
      return res.status(400).json({ error: 'Contact information is required' });
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
      const requestType = isMetaAdsCampaign ? 'Meta Ads Campaign Request' : 'Custom Request';
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

    // Send confirmation emails
    try {
      await sendOrderConfirmationEmail(order, req.user);
    } catch (emailError) {
      console.error('Failed to send order email:', emailError);
      // Don't fail the order if email fails
    }

    res.status(201).json({
      message: 'Request submitted successfully',
      order
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
