import nodemailer from 'nodemailer';

// Create transporter for Outlook
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Helper to format selected options for email
const formatSelectedOptions = (selectedOptions) => {
  if (!selectedOptions) return '';

  const lines = [];

  // Format regular options (skip customText and artworkOption for separate handling)
  Object.entries(selectedOptions).forEach(([key, value]) => {
    if (key === 'customText' || key === 'artworkOption') return;
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    lines.push(`    ${label}: ${value}`);
  });

  return lines.join('\n');
};

// Helper to format custom text content
const formatCustomText = (customText) => {
  if (!customText) return '';

  const lines = [];

  if (customText.headline) lines.push(`    Headline: ${customText.headline}`);
  if (customText.subheadline) lines.push(`    Subheadline: ${customText.subheadline}`);
  if (customText.bodyText) lines.push(`    Body Text: ${customText.bodyText}`);
  if (customText.callToAction) lines.push(`    Call to Action: ${customText.callToAction}`);
  if (customText.contactInfo) lines.push(`    Contact Info: ${customText.contactInfo}`);
  if (customText.additionalNotes) lines.push(`    Designer Notes: ${customText.additionalNotes}`);

  return lines.length > 0 ? '\n  CUSTOM TEXT CONTENT:\n' + lines.join('\n') : '';
};

// Helper to format artwork option
const formatArtworkOption = (artworkOption) => {
  if (!artworkOption) return '';

  const labels = {
    'upload-later': 'Upload Files Later',
    'design-service': 'Use Design Service',
    'use-template': 'Use Academica Template',
    'print-ready': 'Print-Ready Files Provided',
  };

  return `    Artwork: ${labels[artworkOption] || artworkOption}`;
};

// Format a single order item with all details
const formatOrderItem = (item, index) => {
  let itemText = `
${index + 1}. ${item.name}
   Quantity: ${item.quantity}
   Unit Price: $${item.price.toFixed(2)}
   Subtotal: $${(item.price * item.quantity).toFixed(2)}`;

  if (item.selectedOptions) {
    const options = formatSelectedOptions(item.selectedOptions);
    if (options) {
      itemText += `\n  SELECTED OPTIONS:\n${options}`;
    }

    const artworkOption = formatArtworkOption(item.selectedOptions.artworkOption);
    if (artworkOption) {
      itemText += `\n${artworkOption}`;
    }

    const customText = formatCustomText(item.selectedOptions.customText);
    if (customText) {
      itemText += customText;
    }
  }

  return itemText;
};

export async function sendOrderConfirmationEmail(order, user) {
  const transporter = createTransporter();

  const shippingInfo = order.shippingInfo;

  // Format items with full details
  const itemsList = order.items
    .map((item, index) => formatOrderItem(item, index))
    .join('\n\n-------------------------------------------');

  // Customer email (simplified)
  const customerEmailContent = `
Order Confirmation - Order #${order.id.toString().slice(0, 8).toUpperCase()}

Thank you for your order!

School: ${shippingInfo.schoolName}
Contact: ${shippingInfo.contactName}
Position: ${shippingInfo.positionTitle || 'N/A'}
Email: ${shippingInfo.email}
Phone: ${shippingInfo.phone}

Items Ordered:
${order.items.map(item => `- ${item.name} (Qty: ${item.quantity}) - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Order Total: $${order.total.toFixed(2)}

${order.notes ? `Special Instructions: ${order.notes}` : ''}

Your order has been received and is being processed. We will send you a proof for approval before printing.

Thank you for choosing AcademicaMart!
  `.trim();

  // Admin email (full details)
  const adminEmailContent = `
============================================================
NEW ORDER RECEIVED
============================================================

Order #${order.id.toString().slice(0, 8).toUpperCase()}
Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}

============================================================
SCHOOL INFORMATION
============================================================
School Name: ${shippingInfo.schoolName}
Contact Name: ${shippingInfo.contactName}
Position/Title: ${shippingInfo.positionTitle || 'N/A'}
Principal's Name: ${shippingInfo.principalName || 'N/A'}
Email: ${shippingInfo.email}
Phone: ${shippingInfo.phone}

============================================================
ORDER ITEMS (${order.items.length} item${order.items.length > 1 ? 's' : ''})
============================================================
${itemsList}

============================================================
ORDER SUMMARY
============================================================
Total: $${order.total.toFixed(2)}

${order.notes ? `
============================================================
SPECIAL INSTRUCTIONS
============================================================
${order.notes}
` : ''}
============================================================
ACCOUNT INFO
============================================================
User Email: ${user.email}
User ID: ${user.id}
  `.trim();

  // Send to customer
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: shippingInfo.email,
      subject: `Order Confirmation - Order #${order.id.toString().slice(0, 8).toUpperCase()}`,
      text: customerEmailContent,
    });
  } catch (error) {
    console.error('Failed to send customer email:', error.message);
  }

  // Send to admin
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `[NEW ORDER] #${order.id.toString().slice(0, 8).toUpperCase()} - ${shippingInfo.schoolName}`,
      text: adminEmailContent,
    });
  } catch (error) {
    console.error('Failed to send admin email:', error.message);
  }
}

export async function testEmailConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email connection verified successfully');
    return true;
  } catch (error) {
    console.error('Email connection failed:', error.message);
    return false;
  }
}
