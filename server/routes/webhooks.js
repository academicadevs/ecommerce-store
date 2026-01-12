import express from 'express';
import multer from 'multer';
import { simpleParser } from 'mailparser';
import { Order } from '../models/Order.js';
import { OrderCommunication } from '../models/OrderCommunication.js';

const router = express.Router();

// Multer for parsing multipart form data from SendGrid
const upload = multer();

// SendGrid Inbound Parse webhook
// This receives emails when customers reply to order emails
router.post('/sendgrid/inbound', upload.none(), async (req, res) => {
  try {
    let { to, from, subject, text, html, envelope, email: rawEmail } = req.body;

    // Log all available fields for debugging
    console.log('Received inbound email:', { to, from, subject });
    console.log('Body content - text length:', text?.length || 0, 'html length:', html?.length || 0, 'raw email length:', rawEmail?.length || 0);

    // If raw email is provided (Send Raw enabled), parse it
    if (rawEmail && (!text || text.length === 0)) {
      console.log('Parsing raw MIME email...');
      try {
        const parsed = await simpleParser(rawEmail);
        to = to || parsed.to?.text || '';
        from = from || parsed.from?.text || '';
        subject = subject || parsed.subject || '';
        text = parsed.text || '';
        html = parsed.html || '';
        console.log('Parsed from raw - text length:', text?.length || 0, 'subject:', subject);
      } catch (parseErr) {
        console.error('Failed to parse raw email:', parseErr.message);
      }
    }

    // Validate required fields
    if (!to) {
      console.log('Missing "to" field in webhook data. Body keys:', Object.keys(req.body));
      return res.status(200).json({ message: 'Missing to address' });
    }

    // Parse envelope if available (contains parsed sender/recipient info)
    let parsedEnvelope = null;
    if (envelope) {
      try {
        parsedEnvelope = JSON.parse(envelope);
      } catch (e) {
        console.log('Could not parse envelope:', e.message);
      }
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

    // Extract email body - try multiple sources
    let bodyContent = '';
    if (text && text.trim()) {
      // Use plain text if available
      bodyContent = text.trim();
    } else if (html) {
      // Strip HTML tags and decode entities
      bodyContent = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .trim();
    }

    console.log('Extracted body content:', bodyContent.substring(0, 200));

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
