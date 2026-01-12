import express from 'express';
import multer from 'multer';
import { Order } from '../models/Order.js';
import { OrderCommunication } from '../models/OrderCommunication.js';

const router = express.Router();

// Multer for parsing multipart form data from SendGrid
const upload = multer();

// SendGrid Inbound Parse webhook
// This receives emails when customers reply to order emails
router.post('/sendgrid/inbound', upload.none(), (req, res) => {
  try {
    const { to, from, subject, text, html } = req.body;

    console.log('Received inbound email:', { to, from, subject });

    // Validate required fields
    if (!to) {
      console.log('Missing "to" field in webhook data. Body keys:', Object.keys(req.body));
      return res.status(200).json({ message: 'Missing to address' });
    }

    // Parse the reply token from the "to" address
    // Expected format: order-{token}@parse.yourdomain.com
    const replyToToken = OrderCommunication.parseReplyToken(to);

    if (!replyToToken) {
      console.log('Could not parse reply token from:', to);
      // Still return 200 to prevent SendGrid from retrying
      return res.status(200).json({ message: 'Invalid reply address' });
    }

    // Find the original outbound communication
    const originalComm = OrderCommunication.findByReplyToken(replyToToken);

    if (!originalComm) {
      console.log('No communication found for token:', replyToToken);
      return res.status(200).json({ message: 'Communication not found' });
    }

    // Verify the order exists
    const order = Order.findById(originalComm.orderId);
    if (!order) {
      console.log('Order not found:', originalComm.orderId);
      return res.status(200).json({ message: 'Order not found' });
    }

    // Use text body, falling back to stripping HTML
    const bodyContent = text || (html ? html.replace(/<[^>]*>/g, '') : '');

    // Record the inbound communication
    const communication = OrderCommunication.create({
      orderId: originalComm.orderId,
      direction: 'inbound',
      adminId: null, // Customer reply, no admin
      senderEmail: from,
      recipientEmail: to,
      subject: subject || 'Re: ' + originalComm.subject,
      body: bodyContent,
      replyToToken
    });

    console.log('Recorded inbound communication:', communication.id);

    res.status(200).json({ message: 'Email received', communicationId: communication.id });
  } catch (error) {
    console.error('Error processing inbound email:', error);
    // Return 200 anyway to prevent SendGrid retries
    res.status(200).json({ error: 'Failed to process email' });
  }
});

export default router;
