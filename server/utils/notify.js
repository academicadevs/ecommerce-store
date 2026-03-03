import { Notification } from '../models/Notification.js';

function truncate(str, len = 120) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

export function notifyNewMessage({ communication, order }) {
  const contactName = order?.shippingInfo?.contactName || communication.senderEmail;
  Notification.create({
    type: 'message',
    title: `New reply from ${contactName}`,
    body: truncate(communication.body),
    orderId: communication.orderId,
    sourceId: communication.id,
    sourceType: 'order_communication',
    metadata: {
      orderNumber: order?.orderNumber,
      contactName,
      senderEmail: communication.senderEmail,
      subject: communication.subject,
    },
  });
}

export function notifyNewFeedback({ annotation, proof, order }) {
  Notification.create({
    type: 'feedback',
    title: `Proof feedback from ${annotation.authorName || 'Customer'}`,
    body: truncate(annotation.comment),
    orderId: proof.orderId,
    sourceId: annotation.id,
    sourceType: 'proof_annotation',
    metadata: {
      orderNumber: order?.orderNumber,
      contactName: order?.shippingInfo?.contactName,
      authorName: annotation.authorName,
      authorEmail: annotation.authorEmail,
      proofTitle: proof.title,
      proofVersion: proof.version,
    },
  });
}

export function notifyProofSignoff({ proof, order, signedOffBy }) {
  Notification.create({
    type: 'proof_signoff',
    title: `Proof approved by ${signedOffBy}`,
    body: `${proof.title} (v${proof.version}) has been signed off`,
    orderId: proof.orderId,
    sourceId: proof.id,
    sourceType: 'proof',
    metadata: {
      orderNumber: order?.orderNumber,
      contactName: order?.shippingInfo?.contactName,
      signedOffBy,
      proofTitle: proof.title,
      proofVersion: proof.version,
    },
  });
}

export function notifyNewOrder({ order }) {
  const contactName = order?.shippingInfo?.contactName || 'Unknown';
  const schoolName = order?.shippingInfo?.schoolName;
  Notification.create({
    type: 'new_order',
    title: `New request from ${contactName}`,
    body: schoolName ? `School: ${schoolName}` : null,
    orderId: order.id,
    sourceId: order.id,
    sourceType: 'order',
    metadata: {
      orderNumber: order.orderNumber,
      contactName,
      schoolName,
    },
  });
}

export function notifyStatusChange({ order, previousStatus, newStatus, adminName }) {
  const statusLabels = {
    new: 'New Request Received', gathering_details: 'Gathering Project Details', design_phase: 'Design Phase',
    submitted_to_kimp360: 'Submitted to Kimp360', internal_review: 'Internal Review',
    waiting_feedback: 'Waiting for Feedback', waiting_signoff: 'Waiting for Sign Off',
    sent_to_print: 'Sent to Print / Third-Party', completed: 'Completed', on_hold: 'On Hold',
  };
  const from = statusLabels[previousStatus] || previousStatus;
  const to = statusLabels[newStatus] || newStatus;

  Notification.create({
    type: 'status_change',
    title: `Request status changed to ${to}`,
    body: `${adminName} moved #${order.orderNumber} from "${from}" to "${to}"`,
    orderId: order.id,
    sourceId: order.id,
    sourceType: 'order',
    metadata: {
      orderNumber: order.orderNumber,
      contactName: order.shippingInfo?.contactName,
      previousStatus,
      newStatus,
      adminName,
    },
  });
}

export function notifyUserSignup({ user }) {
  Notification.create({
    type: 'user_signup',
    title: `New user registered: ${user.contactName || user.email}`,
    body: user.schoolName ? `School: ${user.schoolName}` : (user.department ? `Department: ${user.department}` : null),
    userId: user.id,
    sourceId: user.id,
    sourceType: 'user',
    metadata: {
      contactName: user.contactName,
      email: user.email,
      userType: user.userType,
      schoolName: user.schoolName,
      department: user.department,
    },
  });
}
