import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { Proof, ProofAnnotation } from '../models/Proof.js';
import { Order } from '../models/Order.js';
import { OrderCommunication } from '../models/OrderCommunication.js';
import { sendOrderEmail } from '../utils/sendgrid.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for proof uploads
const uploadsDir = path.join(__dirname, '../uploads/proofs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDFs are allowed'));
  }
});

// ============================================================
// ADMIN ROUTES (Protected)
// ============================================================

// Get all proofs for an order
router.get('/order/:orderId', authenticate, requireAdmin, (req, res) => {
  try {
    const proofs = Proof.findByOrderId(req.params.orderId);
    res.json({ proofs });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    res.status(500).json({ error: 'Failed to fetch proofs' });
  }
});

// Upload a new proof
router.post('/upload', authenticate, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { orderId, orderItemId, title, sendEmail } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Verify order exists
    const order = Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Create proof record
    const fileUrl = `/uploads/proofs/${req.file.filename}`;
    const proof = Proof.create({
      orderId,
      orderItemId: orderItemId || null,
      title: title || `Proof v${Date.now()}`,
      fileUrl,
      fileType: req.file.mimetype,
      createdBy: req.user.id
    });

    // Send email notification if requested
    if (sendEmail === 'true' || sendEmail === true) {
      const shippingInfo = typeof order.shippingInfo === 'string'
        ? JSON.parse(order.shippingInfo || '{}')
        : (order.shippingInfo || {});
      const customerEmail = shippingInfo.email;
      const firstName = (shippingInfo.contactName || 'Valued Customer').split(' ')[0];

      if (customerEmail) {
        // Generate the proof review URL
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const proofUrl = `${baseUrl}/proof/${proof.accessToken}`;

        // Create the email body
        const subject = `Order #${order.orderNumber} - Proof Ready for Review`;
        const body = `Hi ${firstName},

A proof is ready for your review!

Proof: ${proof.title || `Version ${proof.version}`}

Please click the link below to review the proof and provide feedback or approve the design:

${proofUrl}

You can:
- Click on specific areas of the design to leave feedback
- Draw rectangles to highlight sections that need changes
- Approve the proof when you're satisfied with the design

Best regards,
AcademicaMart Team`;

        // Generate reply token for this proof
        const replyToToken = OrderCommunication.generateReplyToken(orderId);

        // Get existing message IDs for threading
        const threadMessageIds = OrderCommunication.getMessageIdsForOrder(orderId);

        // Send email using the same format as communication emails
        const result = await sendOrderEmail({
          to: customerEmail,
          subject,
          body,
          order: { ...order, shippingInfo },
          replyToToken,
          includeOrderDetails: false,
          threadMessageIds
        });

        // Record in communication feed
        OrderCommunication.create({
          orderId,
          direction: 'outbound',
          adminId: req.user.id,
          senderEmail: process.env.SENDGRID_FROM_EMAIL || 'orders@academicamart.com',
          recipientEmail: customerEmail,
          subject,
          body,
          replyToToken,
          messageId: result.messageId
        });
      }
    }

    res.json({ proof });
  } catch (error) {
    console.error('Error uploading proof:', error);
    res.status(500).json({ error: 'Failed to upload proof' });
  }
});

// Delete a proof
router.delete('/:proofId', authenticate, requireAdmin, (req, res) => {
  try {
    const proof = Proof.findById(req.params.proofId);
    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Delete the file
    const filePath = path.join(__dirname, '..', proof.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    Proof.delete(req.params.proofId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting proof:', error);
    res.status(500).json({ error: 'Failed to delete proof' });
  }
});

// Resolve an annotation (admin only)
router.post('/annotations/:annotationId/resolve', authenticate, requireAdmin, (req, res) => {
  try {
    const annotation = ProofAnnotation.resolve(req.params.annotationId, req.user.contactName || req.user.email);
    res.json({ annotation });
  } catch (error) {
    console.error('Error resolving annotation:', error);
    res.status(500).json({ error: 'Failed to resolve annotation' });
  }
});

// ============================================================
// PUBLIC ROUTES (Token-based access, no auth required)
// ============================================================

// Get proof by access token (public)
router.get('/review/:accessToken', (req, res) => {
  try {
    const proof = Proof.findByAccessToken(req.params.accessToken);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    // Check if expired (but still allow viewing for reference)
    const isExpired = Proof.isExpired(proof);

    // Get version history
    const versionHistory = Proof.getVersionHistory(proof.orderId, proof.orderItemId);

    res.json({
      proof,
      isExpired,
      canAnnotate: !isExpired && proof.status !== 'approved',
      canSignOff: !isExpired && proof.status !== 'approved',
      versionHistory
    });
  } catch (error) {
    console.error('Error fetching proof:', error);
    res.status(500).json({ error: 'Failed to fetch proof' });
  }
});

// Add annotation (public, token-based)
router.post('/review/:accessToken/annotate', (req, res) => {
  try {
    const proof = Proof.findByAccessToken(req.params.accessToken);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (Proof.isExpired(proof)) {
      return res.status(403).json({ error: 'This proof link has expired' });
    }

    if (proof.status === 'approved') {
      return res.status(403).json({ error: 'Cannot add annotations to an approved proof' });
    }

    const { type, x, y, width, height, page, comment, authorName, authorEmail } = req.body;

    if (!type || x === undefined || y === undefined || !comment || !authorName) {
      return res.status(400).json({ error: 'Missing required fields: type, x, y, comment, authorName' });
    }

    const annotation = ProofAnnotation.create({
      proofId: proof.id,
      type,
      x,
      y,
      width: width || null,
      height: height || null,
      page: page || 1,
      comment,
      authorName,
      authorEmail
    });

    // Update proof status to indicate feedback received
    if (proof.status === 'pending') {
      Proof.updateStatus(proof.id, 'feedback_received');
    }

    res.json({ annotation });
  } catch (error) {
    console.error('Error adding annotation:', error);
    res.status(500).json({ error: 'Failed to add annotation' });
  }
});

// Delete annotation (public, token-based)
router.delete('/review/:accessToken/annotations/:annotationId', (req, res) => {
  try {
    const proof = Proof.findByAccessToken(req.params.accessToken);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (Proof.isExpired(proof)) {
      return res.status(403).json({ error: 'This proof link has expired' });
    }

    if (proof.status === 'approved') {
      return res.status(403).json({ error: 'Cannot delete annotations from an approved proof' });
    }

    const annotation = ProofAnnotation.findById(req.params.annotationId);
    if (!annotation || annotation.proofId !== proof.id) {
      return res.status(404).json({ error: 'Annotation not found' });
    }

    ProofAnnotation.delete(req.params.annotationId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting annotation:', error);
    res.status(500).json({ error: 'Failed to delete annotation' });
  }
});

// Sign off on proof (public, token-based)
router.post('/review/:accessToken/signoff', (req, res) => {
  try {
    const proof = Proof.findByAccessToken(req.params.accessToken);

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (Proof.isExpired(proof)) {
      return res.status(403).json({ error: 'This proof link has expired' });
    }

    if (proof.status === 'approved') {
      return res.status(400).json({ error: 'This proof has already been approved' });
    }

    const { signedOffBy, signature, signatureType } = req.body;

    if (!signedOffBy || !signature) {
      return res.status(400).json({ error: 'Name and signature are required' });
    }

    const updatedProof = Proof.signOff(proof.id, {
      signedOffBy,
      signature,
      signatureType: signatureType || 'typed'
    });

    // Record sign-off in communication feed
    const order = Order.findById(proof.orderId);
    if (order) {
      OrderCommunication.create({
        orderId: proof.orderId,
        direction: 'inbound',
        adminId: null,
        senderEmail: proof.shippingInfo?.email || signedOffBy,
        recipientEmail: process.env.SENDGRID_FROM_EMAIL || 'orders@academicamart.com',
        subject: `Proof Approved - Order #${order.orderNumber}`,
        body: `${signedOffBy} has approved Proof Version ${proof.version}.\n\nSignature: ${signature}\nSigned at: ${new Date().toLocaleString()}`,
        replyToToken: `proof-signoff-${proof.id}`
      });
    }

    res.json({ proof: updatedProof, message: 'Proof approved successfully' });
  } catch (error) {
    console.error('Error signing off proof:', error);
    res.status(500).json({ error: 'Failed to sign off proof' });
  }
});

// Serve proof files
router.get('/file/:filename', (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.sendFile(filePath);
});

export default router;
