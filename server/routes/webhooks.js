import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { simpleParser } from 'mailparser';
import { Order } from '../models/Order.js';
import { OrderCommunication } from '../models/OrderCommunication.js';
import { logAudit } from '../utils/auditLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Ensure attachments directory exists - use Railway volume in production
const baseUploadsDir = process.env.UPLOADS_PATH || path.join(__dirname, '../uploads');
const attachmentsDir = path.join(baseUploadsDir, 'attachments');
if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Multer for parsing multipart form data from SendGrid
// Increase field size limit for large emails with embedded attachments
const upload = multer({
  limits: {
    fieldSize: 50 * 1024 * 1024 // 50MB - raw email can be large with attachments
  }
});

/**
 * Strip email signature and quoted reply text from email body
 * Keeps only the new message content
 */
function stripSignatureAndQuotes(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const cleanLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // Stop at signature delimiter (common patterns)
    if (trimmedLine === '--' || trimmedLine === '-- ' || trimmedLine === '*—*' || trimmedLine === '---') {
      break;
    }

    // Stop at "On [date], [name] wrote:" pattern (various formats)
    // Gmail: "On Mon, Jan 12, 2026 at 3:45 PM John Doe <john@example.com> wrote:"
    // Apple: "On Jan 12, 2026, at 3:45 PM, John Doe <john@example.com> wrote:"
    if (/^On\s+.+wrote:?\s*$/i.test(trimmedLine)) {
      break;
    }

    // Handle "On [date]" that continues on next line with "wrote:"
    if (/^On\s+(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d)/i.test(trimmedLine)) {
      // Look ahead to see if next non-empty line ends with "wrote:"
      let foundWrote = false;
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = lines[j].trim();
        if (nextLine && /wrote:?\s*$/i.test(nextLine)) {
          foundWrote = true;
          break;
        }
      }
      if (foundWrote || trimmedLine.includes('<') && trimmedLine.includes('@')) {
        break;
      }
    }

    // Stop at lines starting with ">" (quoted text)
    if (trimmedLine.startsWith('>')) {
      break;
    }

    // Stop at "From:" header (forwarded/quoted email - Outlook style)
    if (/^From:\s*.+$/i.test(trimmedLine)) {
      break;
    }

    // Stop at Outlook-style separator
    if (/^_{10,}$/.test(trimmedLine) || /^-{10,}$/.test(trimmedLine)) {
      break;
    }

    // Stop at "Original Message" markers
    if (/^-+\s*Original Message\s*-+$/i.test(trimmedLine)) {
      break;
    }

    // Stop at horizontal rules or separators often used before signatures
    if (/^[-_=]{3,}$/.test(trimmedLine)) {
      break;
    }

    // Stop at common mobile signatures
    if (/^Sent from (my )?(iPhone|iPad|Android|Galaxy|Samsung|Mobile|Outlook)/i.test(trimmedLine)) {
      break;
    }

    // Stop at "Get Outlook for iOS/Android" type signatures
    if (/^Get Outlook for (iOS|Android)/i.test(trimmedLine)) {
      break;
    }

    cleanLines.push(line);
  }

  // Remove trailing empty lines
  while (cleanLines.length > 0 && cleanLines[cleanLines.length - 1].trim() === '') {
    cleanLines.pop();
  }

  return cleanLines.join('\n').trim();
}

// SendGrid Inbound Parse webhook
// This receives emails when customers reply to order emails
router.post('/sendgrid/inbound', upload.none(), async (req, res) => {
  try {
    let { to, from, subject, text, html, envelope, email: rawEmail } = req.body;

    // Log all available fields for debugging
    console.log('Received inbound email:', { to, from, subject });
    console.log('Body content - text length:', text?.length || 0, 'html length:', html?.length || 0, 'raw email length:', rawEmail?.length || 0);

    // Parse attachments from the raw email
    let emailAttachments = [];

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

        // Extract attachments
        if (parsed.attachments && parsed.attachments.length > 0) {
          console.log('Found', parsed.attachments.length, 'attachments');
          for (const att of parsed.attachments) {
            try {
              // Generate unique filename
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
              const ext = path.extname(att.filename || '') || '.bin';
              const savedFilename = uniqueSuffix + ext;
              const filePath = path.join(attachmentsDir, savedFilename);

              // Save the attachment
              fs.writeFileSync(filePath, att.content);

              emailAttachments.push({
                filename: att.filename || 'attachment',
                path: `/uploads/attachments/${savedFilename}`,
                type: att.contentType || 'application/octet-stream',
                size: att.size || att.content.length
              });
              console.log('Saved attachment:', att.filename, 'as', savedFilename);
            } catch (saveErr) {
              console.error('Failed to save attachment:', saveErr.message);
            }
          }
        }
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
      // Remove quoted content from HTML before stripping tags
      // Gmail uses <div class="gmail_quote">, Outlook uses <div id="appendonsend">
      let cleanHtml = html
        .replace(/<div[^>]*class=["'][^"']*gmail_quote[^"']*["'][^>]*>[\s\S]*$/gi, '')
        .replace(/<div[^>]*id=["']?appendonsend["']?[^>]*>[\s\S]*$/gi, '')
        .replace(/<blockquote[^>]*>[\s\S]*<\/blockquote>/gi, '')
        .replace(/<div[^>]*class=["'][^"']*yahoo_quoted[^"']*["'][^>]*>[\s\S]*$/gi, '');

      // Strip HTML tags and decode entities
      bodyContent = cleanHtml
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
    }

    // Strip signature and quoted reply text (handles plain text patterns)
    bodyContent = stripSignatureAndQuotes(bodyContent);

    console.log('Final cleaned body:', bodyContent.substring(0, 300));

    // Record the inbound communication with attachments
    const communication = OrderCommunication.create({
      orderId: originalComm.orderId,
      direction: 'inbound',
      adminId: null, // Customer reply, no admin
      senderEmail: from,
      recipientEmail: to,
      subject: subject || 'Re: ' + originalComm.subject,
      body: bodyContent,
      replyToToken,
      attachments: emailAttachments.length > 0 ? emailAttachments : null
    });

    console.log('Recorded inbound communication:', communication.id);

    logAudit(req, { action: 'communication.inbound_received', category: 'communications', targetId: originalComm.orderId, targetType: 'order', details: { from, subject: subject || 'Re: ' + originalComm.subject, orderNumber: order.orderNumber, contactName: order.shippingInfo?.contactName, hasAttachments: emailAttachments.length > 0 } });

    res.status(200).json({ message: 'Email received', communicationId: communication.id });
  } catch (error) {
    console.error('Error processing inbound email:', error);
    // Return 200 anyway to prevent SendGrid retries
    res.status(200).json({ error: 'Failed to process email' });
  }
});

export default router;
