import sgMail from '@sendgrid/mail';

// SendGrid is initialized lazily to ensure env vars are loaded
let sgInitialized = false;

function initSendGrid() {
  if (sgInitialized) return;
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    sgInitialized = true;
  }
}

function getConfig() {
  return {
    apiKey: process.env.SENDGRID_API_KEY,
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'orders@academicamart.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Academica Design Dept.',
    inboundDomain: process.env.SENDGRID_INBOUND_DOMAIN || 'parse.academicamart.com'
  };
}

// System font stack - uses native fonts on each platform
const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Send an order-related email with unique reply-to for routing
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (plain text message)
 * @param {Object} options.order - Full order object with details
 * @param {string} options.replyToToken - Token for routing replies (e.g., 'ord-a1b2c3d4')
 * @param {Array} options.attachments - File attachments
 * @param {Array} options.threadMessageIds - Previous message IDs for threading
 * @returns {Promise<{success: boolean, from?: string, messageId?: string, error?: string}>}
 */
export async function sendOrderEmail({ to, subject, body, order, replyToToken, attachments, includeOrderDetails = true, threadMessageIds = [] }) {
  const config = getConfig();
  const orderNumber = order.orderNumber;

  // Generate a unique Message-ID using UUID format for better deliverability
  const crypto = await import('crypto');
  const uuid = crypto.randomUUID();
  const messageId = `<${uuid}@academicamart.com>`;

  // Get CC recipients from order's additionalEmails
  const ccEmails = order.shippingInfo?.additionalEmails || [];

  if (!config.apiKey) {
    console.warn('SENDGRID_API_KEY not configured - email not sent');
    // In development, log the email and return success for testing
    console.log('Would send email:', { to, cc: ccEmails, subject, body: generatePlainTextEmail(body, order, includeOrderDetails), orderNumber, replyToToken, attachments: attachments?.length || 0, messageId, threadMessageIds });
    return {
      success: true,
      from: config.fromEmail,
      messageId,
      dev: true
    };
  }

  // Initialize SendGrid
  initSendGrid();

  try {
    // Create unique reply-to address for routing inbound emails
    // Format: order-{token}@parse.yourdomain.com
    const replyToAddress = `order-${replyToToken.replace('ord-', '')}@${config.inboundDomain}`;

    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      replyTo: replyToAddress,
      subject: subject,
      text: generatePlainTextEmail(body, order, includeOrderDetails),
      html: generateHtmlEmail(body, order, includeOrderDetails),
      headers: {
        'Message-ID': messageId,
        'X-Entity-Ref-ID': uuid, // Unique identifier to prevent duplicate detection
        'X-Mailer': 'AcademicaMart-OrderSystem'
      }
    };

    // Note: Threading headers (In-Reply-To, References) are intentionally omitted
    // as they can cause deliverability issues with some email providers

    // Add CC recipients if any
    if (ccEmails.length > 0) {
      msg.cc = ccEmails;
    }

    // Add attachments if present
    if (attachments && attachments.length > 0) {
      const fs = await import('fs');
      msg.attachments = attachments.map(file => ({
        content: fs.readFileSync(file.path).toString('base64'),
        filename: file.originalname,
        type: file.mimetype,
        disposition: 'attachment'
      }));
    }

    await sgMail.send(msg);
    console.log('Email sent successfully to:', to, ccEmails.length > 0 ? `(CC: ${ccEmails.join(', ')})` : '');

    return { success: true, from: config.fromEmail, cc: ccEmails, messageId };
  } catch (error) {
    console.error('SendGrid error:', error.response?.body || error.message);
    return {
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message
    };
  }
}

/**
 * Generate plain text version of email with order details
 */
function generatePlainTextEmail(body, order, includeOrderDetails = true) {
  if (!includeOrderDetails) {
    return body;
  }

  const shipping = order.shippingInfo || {};
  const items = order.items || [];

  let text = body + '\n\n';
  text += '═══════════════════════════════════════════════════════════════\n';
  text += '                       ORDER DETAILS\n';
  text += '═══════════════════════════════════════════════════════════════\n\n';

  text += `Order #:     ${order.orderNumber}\n`;
  if (shipping.isInternalOrder) {
    text += `Type:        Internal Academica Order\n`;
    text += `Contact:     ${shipping.contactName || 'N/A'}\n`;
    text += `Department:  ${shipping.department || 'N/A'}\n`;
  } else {
    text += `School:      ${shipping.schoolName || 'N/A'}\n`;
    text += `Contact:     ${shipping.contactName || 'N/A'}\n`;
    if (shipping.positionTitle) text += `Position:    ${shipping.positionTitle}\n`;
  }
  text += `Phone:       ${shipping.phone || 'N/A'}\n`;
  text += `Email:       ${shipping.email || 'N/A'}\n\n`;

  text += '───────────────────────────────────────────────────────────────\n';
  text += '                       ORDER ITEMS\n';
  text += '───────────────────────────────────────────────────────────────\n\n';

  items.forEach((item, index) => {
    text += `${index + 1}. ${item.name}\n`;

    // Add all options (check both selectedOptions and options)
    const opts = item.selectedOptions || item.options || {};
    if (Object.keys(opts).length > 0) {
      Object.entries(opts).forEach(([key, value]) => {
        if (value && key !== 'customText' && key !== 'artworkOption') {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          text += `   ${label}: ${value}\n`;
        }
      });
      if (opts.artworkOption) {
        const artworkLabel = opts.artworkOption === 'use_existing' ? 'Use existing artwork' :
                            opts.artworkOption === 'send_later' ? 'Will send later' : opts.artworkOption;
        text += `   Artwork: ${artworkLabel}\n`;
      }
      if (opts.customText) {
        if (typeof opts.customText === 'object') {
          if (opts.customText.headline) text += `   Headline: ${opts.customText.headline}\n`;
          if (opts.customText.subheadline) text += `   Subheadline: ${opts.customText.subheadline}\n`;
          if (opts.customText.bodyText) text += `   Body Text: ${opts.customText.bodyText}\n`;
        } else {
          text += `   Custom Text: ${opts.customText}\n`;
        }
      }
    }
    text += '\n';
  });

  text += '═══════════════════════════════════════════════════════════════\n';

  return text;
}

/**
 * Generate professional HTML email with proper tables
 */
function generateHtmlEmail(body, order, includeOrderDetails = true) {
  const shipping = order.shippingInfo || {};
  const items = order.items || [];

  // Escape the message body for HTML
  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  // Simple message-only email if order details not included
  if (!includeOrderDetails) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Message from AcademicaMart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${systemFontStack};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-family: ${systemFontStack}; font-size: 24px; font-weight: 700; color: #111827;">AcademicaMart</h1>
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Order #${order.orderNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <div style="font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                ${escapedBody}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">This email is regarding your order with AcademicaMart.</p>
              <p style="margin: 0; font-family: ${systemFontStack}; font-size: 13px; color: #374151;"><strong>Simply reply to this email to respond.</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  // Build order items rows
  let itemsHtml = '';
  items.forEach((item, index) => {
    const rowBg = index % 2 === 0 ? '#ffffff' : '#f9fafb';

    // Build options string (check both selectedOptions and options)
    const opts = item.selectedOptions || item.options || {};
    let optionsHtml = '';
    if (Object.keys(opts).length > 0) {
      const optionsList = [];
      Object.entries(opts).forEach(([key, value]) => {
        if (value && key !== 'customText' && key !== 'artworkOption') {
          const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
          optionsList.push(`<strong>${label}:</strong> ${escapeHtml(String(value))}`);
        }
      });
      if (opts.artworkOption) {
        const artworkLabel = opts.artworkOption === 'use_existing' ? 'Use existing artwork' :
                            opts.artworkOption === 'send_later' ? 'Will send later' : escapeHtml(opts.artworkOption);
        optionsList.push(`<strong>Artwork:</strong> ${artworkLabel}`);
      }
      if (optionsList.length > 0) {
        optionsHtml = `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${optionsList.join(' &bull; ')}</div>`;
      }
      if (opts.customText) {
        if (typeof opts.customText === 'object') {
          const textParts = [];
          if (opts.customText.headline) textParts.push(`<strong>Headline:</strong> ${escapeHtml(opts.customText.headline)}`);
          if (opts.customText.subheadline) textParts.push(`<strong>Subheadline:</strong> ${escapeHtml(opts.customText.subheadline)}`);
          if (opts.customText.bodyText) textParts.push(`<strong>Body Text:</strong> ${escapeHtml(opts.customText.bodyText)}`);
          if (textParts.length > 0) {
            optionsHtml += `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;">${textParts.join('<br>')}</div>`;
          }
        } else {
          optionsHtml += `<div style="font-size: 13px; color: #6b7280; margin-top: 4px;"><strong>Custom Text:</strong> ${escapeHtml(opts.customText)}</div>`;
        }
      }
    }

    itemsHtml += `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-family: ${systemFontStack}; font-size: 14px; color: #374151;">
          <div style="font-weight: 600; color: #111827;">${escapeHtml(item.name)}</div>
          ${optionsHtml}
        </td>
      </tr>
    `;
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order ${order.orderNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${systemFontStack}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-family: ${systemFontStack}; font-size: 24px; font-weight: 700; color: #111827;">AcademicaMart</h1>
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Order #${order.orderNumber}</p>
            </td>
          </tr>

          <!-- Message Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                ${escapedBody}
              </div>
            </td>
          </tr>

          <!-- Order Information Section -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <h2 style="margin: 0 0 16px 0; font-family: ${systemFontStack}; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">${shipping.isInternalOrder ? 'Contact Information' : 'Order Information'}</h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; width: 120px; border-bottom: 1px solid #e5e7eb;">Order Number</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${order.orderNumber}</td>
                </tr>
                ${shipping.isInternalOrder ? `
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Type</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #7c3aed; font-weight: 600; border-bottom: 1px solid #e5e7eb;">Internal Academica Order</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Contact</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(shipping.contactName || 'N/A')}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Department</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(shipping.department || 'N/A')}</td>
                </tr>
                ` : `
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">School</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(shipping.schoolName || 'N/A')}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Contact</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(shipping.contactName || 'N/A')}${shipping.positionTitle ? ` <span style="color: #6b7280;">- ${escapeHtml(shipping.positionTitle)}</span>` : ''}</td>
                </tr>
                `}
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Phone</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb;">${escapeHtml(shipping.phone || 'N/A')}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">Email</td>
                  <td style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 14px; color: #111827;">${escapeHtml(shipping.email || 'N/A')}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Order Items Section -->
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <h2 style="margin: 0 0 16px 0; font-family: ${systemFontStack}; font-size: 18px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Order Items</h2>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 12px 16px; font-family: ${systemFontStack}; font-size: 12px; font-weight: 600; color: #6b7280; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e5e7eb;">Product</th>
                </tr>
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">This email is regarding your order with AcademicaMart.</p>
              <p style="margin: 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;"><strong>Simply reply to this email to respond.</strong></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Send proof notification email to customer
 */
export async function sendProofEmail({ to, order, proof, proofUrl }) {
  const config = getConfig();
  const shippingInfo = typeof order.shippingInfo === 'string'
    ? JSON.parse(order.shippingInfo)
    : order.shippingInfo;

  const contactName = shippingInfo?.contactName || 'Valued Customer';
  const firstName = contactName.split(' ')[0];
  const orderNumber = order.orderNumber;

  // Generate a unique Message-ID using UUID format for better deliverability
  const crypto = await import('crypto');
  const uuid = crypto.randomUUID();
  const messageId = `<${uuid}@academicamart.com>`;

  // Get CC recipients
  const ccEmails = shippingInfo?.additionalEmails || [];

  if (!config.apiKey) {
    console.warn('SENDGRID_API_KEY not configured - proof email not sent');
    console.log('Would send proof email:', { to, cc: ccEmails, orderNumber, proofUrl, messageId });
    return { success: true, from: config.fromEmail, messageId, dev: true };
  }

  // Initialize SendGrid
  initSendGrid();

  try {
    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      replyTo: config.fromEmail,
      subject: `Order #${orderNumber} - Proof Ready for Review`,
      text: generateProofPlainText(firstName, orderNumber, proof, proofUrl),
      html: generateProofHtml(firstName, orderNumber, proof, proofUrl),
      headers: {
        'Message-ID': messageId,
        'X-Entity-Ref-ID': uuid, // Unique identifier to prevent duplicate detection
        'X-Mailer': 'AcademicaMart-OrderSystem'
      }
    };

    if (ccEmails.length > 0) {
      msg.cc = ccEmails;
    }

    await sgMail.send(msg);
    console.log('Proof email sent successfully to:', to, ccEmails.length > 0 ? `(CC: ${ccEmails.join(', ')})` : '');

    return { success: true, from: config.fromEmail, messageId };
  } catch (error) {
    console.error('SendGrid error (proof):', error.response?.body || error.message);
    return {
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message
    };
  }
}

function generateProofPlainText(firstName, orderNumber, proof, proofUrl) {
  return `
Hi ${firstName},

A proof is ready for your review!

Order: #${orderNumber}
Proof: ${proof.title || `Version ${proof.version}`}

Please click the link below to review the proof and provide feedback or approve the design:

${proofUrl}

You can:
- Click on specific areas of the design to leave feedback
- Draw rectangles to highlight sections
- Approve the proof when you're satisfied with the design

This link will expire in 60 days.

If you have any questions, simply reply to this email.

Best regards,
AcademicaMart Team
  `.trim();
}

function generateProofHtml(firstName, orderNumber, proof, proofUrl) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Proof Ready for Review</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${systemFontStack};">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-family: ${systemFontStack}; font-size: 24px; font-weight: 700; color: #111827;">AcademicaMart</h1>
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Order #${orderNumber}</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 20px 0; font-family: ${systemFontStack}; font-size: 16px; color: #374151;">
                Hi ${escapeHtml(firstName)},
              </p>
              <p style="margin: 0 0 24px 0; font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                A proof is ready for your review! Please take a moment to review the design and provide any feedback or approve it for production.
              </p>

              <!-- Proof Info Box -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">PROOF DETAILS</p>
                <p style="margin: 0; font-family: ${systemFontStack}; font-size: 18px; font-weight: 600; color: #111827;">${escapeHtml(proof.title || `Version ${proof.version}`)}</p>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${proofUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; font-family: ${systemFontStack}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
                  Review Proof
                </a>
              </div>

              <!-- Instructions -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                <p style="margin: 0 0 12px 0; font-family: ${systemFontStack}; font-size: 14px; font-weight: 600; color: #111827;">What you can do:</p>
                <ul style="margin: 0; padding: 0 0 0 20px; font-family: ${systemFontStack}; font-size: 14px; line-height: 1.8; color: #374151;">
                  <li>Click on specific areas of the design to leave feedback</li>
                  <li>Draw rectangles to highlight sections that need changes</li>
                  <li>Approve the proof when you're satisfied with the design</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 32px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">This email is regarding your order with AcademicaMart.</p>
              <p style="margin: 0; font-family: ${systemFontStack}; font-size: 13px; color: #374151;"><strong>Simply reply to this email to respond.</strong></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export default { sendOrderEmail, sendProofEmail };
