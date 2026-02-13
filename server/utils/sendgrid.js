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
    inboundDomain: process.env.SENDGRID_INBOUND_DOMAIN || 'parse.academicamart.com',
    websiteUrl: 'https://academicamart.com'
  };
}

// System font stack - uses native fonts on each platform
const systemFontStack = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/**
 * Generate common email headers for deliverability
 */
async function generateEmailHeaders(config, replyToAddress) {
  const crypto = await import('crypto');
  const uuid = crypto.randomUUID();
  const messageId = `<${uuid}@academicamart.com>`;

  return {
    messageId,
    uuid,
    headers: {
      'Message-ID': messageId,
      'X-Entity-Ref-ID': uuid,
      'X-Mailer': 'AcademicaMart-OrderSystem/1.0',
      'Precedence': 'bulk',
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      // List-Unsubscribe header - critical for Microsoft deliverability
      'List-Unsubscribe': `<mailto:${config.fromEmail}?subject=Unsubscribe>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  };
}

/**
 * Get personalized greeting based on contact name
 */
function getPersonalizedGreeting(shippingInfo) {
  const contactName = shippingInfo?.contactName || 'Valued Customer';
  const firstName = contactName.split(' ')[0];
  return { contactName, firstName };
}

/**
 * Send an order-related email with unique reply-to for routing
 */
export async function sendOrderEmail({ to, subject, body, order, replyToToken, attachments, includeOrderDetails = true, threadMessageIds = [] }) {
  const config = getConfig();
  const orderNumber = order.orderNumber;
  const shipping = order.shippingInfo || {};
  const { firstName } = getPersonalizedGreeting(shipping);

  // Generate headers for deliverability
  const { messageId, uuid, headers } = await generateEmailHeaders(config);

  // Get CC recipients from order's additionalEmails
  const ccEmails = shipping.additionalEmails || [];

  if (!config.apiKey) {
    console.warn('SENDGRID_API_KEY not configured - email not sent');
    console.log('Would send email:', { to, cc: ccEmails, subject, orderNumber, replyToToken, attachments: attachments?.length || 0, messageId });
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
    const replyToAddress = `order-${replyToToken.replace('ord-', '')}@${config.inboundDomain}`;

    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      replyTo: replyToAddress,
      subject: subject,
      text: generatePlainTextEmail(body, order, config, includeOrderDetails),
      html: generateHtmlEmail(body, order, config, includeOrderDetails),
      headers,
      // Disable click tracking to prevent URL rewriting issues
      // SendGrid rewrites URLs for tracking, but requires DNS setup for the tracking subdomain
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false
        }
      }
    };

    // Add threading headers if there are previous messages (keeps emails in same thread)
    if (threadMessageIds && threadMessageIds.length > 0) {
      msg.headers['In-Reply-To'] = threadMessageIds[threadMessageIds.length - 1];
      msg.headers['References'] = threadMessageIds.join(' ');
    }

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
    console.log('Email sent successfully to:', to, ccEmails.length > 0 ? `(CC: ${ccEmails.join(', ')})` : '', '| Subject:', subject);

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
 * Generate plain text version of email
 */
function generatePlainTextEmail(body, order, config, includeOrderDetails = true) {
  const shipping = order.shippingInfo || {};
  const { firstName } = getPersonalizedGreeting(shipping);
  const items = order.items || [];

  let text = body + '\n\n';

  if (includeOrderDetails) {
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

    text += '═══════════════════════════════════════════════════════════════\n\n';
  }

  // Add footer with company info
  text += '---\n';
  text += `AcademicaMart | ${config.websiteUrl}\n`;
  text += 'To stop receiving order updates, reply with "Unsubscribe" in the subject.\n';

  return text;
}

/**
 * Generate professional HTML email
 */
function generateHtmlEmail(body, order, config, includeOrderDetails = true) {
  const shipping = order.shippingInfo || {};
  const { firstName } = getPersonalizedGreeting(shipping);
  const items = order.items || [];

  // Escape the message body for HTML and convert URLs to clickable links
  const escapedBody = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color: #2563eb; text-decoration: underline;">$1</a>');

  // Footer HTML (CAN-SPAM compliance + deliverability)
  const footerHtml = `
    <tr>
      <td style="background-color: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; color: #6b7280;">
          This email is regarding your order with AcademicaMart. <strong>Simply reply to this email to respond.</strong>
        </p>
        <p style="margin: 12px 0 0 0; font-family: ${systemFontStack}; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          AcademicaMart | <a href="${config.websiteUrl}" style="color: #9ca3af;">${config.websiteUrl}</a><br>
          <a href="mailto:${config.fromEmail}?subject=Unsubscribe" style="color: #9ca3af;">Unsubscribe from order updates</a>
        </p>
      </td>
    </tr>
  `;

  // Simple message-only email (but still with context)
  if (!includeOrderDetails) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Order #${order.orderNumber} - AcademicaMart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${systemFontStack}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-family: ${systemFontStack}; font-size: 24px; font-weight: 700; color: #111827;">AcademicaMart</h1>
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Order #${order.orderNumber}${shipping.schoolName ? ` - ${escapeHtml(shipping.schoolName)}` : ''}</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <div style="font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                ${escapedBody}
              </div>
            </td>
          </tr>
          <!-- Order Reference Box -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 6px; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 4px 0; font-family: ${systemFontStack}; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference</p>
                    <p style="margin: 0; font-family: ${systemFontStack}; font-size: 14px; color: #111827;">
                      <strong>#${order.orderNumber}</strong>
                      ${shipping.contactName ? ` | ${escapeHtml(shipping.contactName)}` : ''}
                      ${shipping.schoolName ? ` | ${escapeHtml(shipping.schoolName)}` : ''}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${footerHtml}
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
  <title>Order #${order.orderNumber} - AcademicaMart</title>
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
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Order #${order.orderNumber}${shipping.schoolName ? ` - ${escapeHtml(shipping.schoolName)}` : ''}</p>
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

          ${footerHtml}

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
 * Uses sendOrderEmail internally for consistency and threading
 */
export async function sendProofEmail({ to, order, proof, proofUrl, replyToToken, threadMessageIds = [] }) {
  const config = getConfig();
  const shippingInfo = typeof order.shippingInfo === 'string'
    ? JSON.parse(order.shippingInfo)
    : order.shippingInfo;

  const { firstName } = getPersonalizedGreeting(shippingInfo);
  const orderNumber = order.orderNumber;

  // Build personalized email body
  const body = `Hi ${firstName},

A design proof is ready for your review for Order #${orderNumber}.

**Proof:** ${proof.title || `Version ${proof.version}`}

Please review the proof using the secure link below:
${proofUrl}

**What you can do:**
- View the full design proof
- Leave feedback by clicking on specific areas
- Draw rectangles to highlight sections that need changes
- Approve the proof when you're satisfied

This secure link will expire in 60 days. If you have any questions, simply reply to this email.

Thank you for your order!`;

  // Use sendOrderEmail for consistent deliverability and threading
  return sendOrderEmail({
    to,
    subject: `Order #${orderNumber} - Your Design Proof is Ready`,
    body,
    order: { ...order, shippingInfo },
    replyToToken: replyToToken || `proof-${proof.id}`,
    includeOrderDetails: false,
    threadMessageIds
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({ to, contactName, resetUrl }) {
  const config = getConfig();

  if (!config.apiKey) {
    console.warn('SENDGRID_API_KEY not configured - password reset email not sent');
    console.log('Would send password reset email:', { to, contactName, resetUrl });
    return { success: true, dev: true };
  }

  initSendGrid();

  try {
    const { messageId, headers } = await generateEmailHeaders(config);

    const msg = {
      to,
      from: {
        email: config.fromEmail,
        name: config.fromName
      },
      subject: 'Reset Your AcademicaMart Password',
      text: generatePasswordResetPlainText(contactName, resetUrl, config),
      html: generatePasswordResetHtml(contactName, resetUrl, config),
      headers,
      trackingSettings: {
        clickTracking: {
          enable: false,
          enableText: false
        }
      }
    };

    await sgMail.send(msg);
    console.log('Password reset email sent to:', to);
    return { success: true, messageId };
  } catch (error) {
    console.error('SendGrid password reset error:', error.response?.body || error.message);
    return {
      success: false,
      error: error.response?.body?.errors?.[0]?.message || error.message
    };
  }
}

function generatePasswordResetPlainText(firstName, resetUrl, config) {
  return `Hi ${escapeHtml(firstName)},

We received a request to reset your password for your AcademicaMart account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.

---
AcademicaMart | ${config.websiteUrl}
`;
}

function generatePasswordResetHtml(firstName, resetUrl, config) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Reset Your Password - AcademicaMart</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: ${systemFontStack}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td style="padding: 30px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #e5e7eb;">
              <h1 style="margin: 0; font-family: ${systemFontStack}; font-size: 24px; font-weight: 700; color: #111827;">AcademicaMart</h1>
              <p style="margin: 4px 0 0 0; font-family: ${systemFontStack}; font-size: 14px; color: #6b7280;">Password Reset Request</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                Hi ${escapeHtml(firstName)},
              </p>
              <p style="margin: 0 0 24px 0; font-family: ${systemFontStack}; font-size: 15px; line-height: 1.6; color: #374151;">
                We received a request to reset your password for your AcademicaMart account. Click the button below to choose a new password:
              </p>
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="padding: 0 0 24px 0;" align="center">
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-family: ${systemFontStack}; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 6px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 13px; line-height: 1.6; color: #6b7280;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-family: ${systemFontStack}; font-size: 13px; line-height: 1.6; color: #2563eb; word-break: break-all;">
                ${escapeHtml(resetUrl)}
              </p>
              <p style="margin: 0 0 8px 0; font-family: ${systemFontStack}; font-size: 14px; line-height: 1.6; color: #374151; font-weight: 600;">
                This link expires in 1 hour.
              </p>
              <p style="margin: 0; font-family: ${systemFontStack}; font-size: 14px; line-height: 1.6; color: #6b7280;">
                If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-family: ${systemFontStack}; font-size: 11px; color: #9ca3af; line-height: 1.5;">
                AcademicaMart | <a href="${config.websiteUrl}" style="color: #9ca3af;">${config.websiteUrl}</a>
              </p>
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

export default { sendOrderEmail, sendProofEmail, sendPasswordResetEmail };
