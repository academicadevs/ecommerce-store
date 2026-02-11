import db from '../utils/database.js';
import crypto from 'crypto';

export class Proof {
  static generateId() {
    return 'prf_' + crypto.randomBytes(12).toString('hex');
  }

  /**
   * Convert text to URL-friendly slug
   */
  static slugify(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/['']/g, '')           // Remove apostrophes
      .replace(/[^a-z0-9\s-]/g, '')   // Remove special characters
      .replace(/\s+/g, '-')           // Replace spaces with hyphens
      .replace(/-+/g, '-')            // Collapse multiple hyphens
      .replace(/^-|-$/g, '')          // Trim hyphens from ends
      .slice(0, 30);                  // Limit length
  }

  /**
   * Generate a human-readable access token based on order and file info
   * Format: {order-identifier}-{title}-v{version}-{short-unique}
   * Example: smith-elementary-banner-v1-x7k2
   */
  static generateAccessToken(orderId, title, version) {
    // Get order info for naming
    const order = db.prepare(`SELECT orderNumber, shippingInfo FROM orders WHERE id = ?`).get(orderId);

    let orderIdentifier = '';
    if (order) {
      const shippingInfo = JSON.parse(order.shippingInfo || '{}');
      // Use school name for external orders, contact name for internal
      if (shippingInfo.isInternalOrder) {
        orderIdentifier = this.slugify(shippingInfo.contactName || shippingInfo.department);
      } else {
        orderIdentifier = this.slugify(shippingInfo.schoolName || shippingInfo.contactName);
      }
    }

    // Fallback if no order identifier found
    if (!orderIdentifier) {
      orderIdentifier = 'order';
    }

    // Slugify the title (comes from filename or user input)
    const titleSlug = this.slugify(title) || 'proof';

    // Short unique suffix (4 chars) to ensure uniqueness
    const uniqueSuffix = crypto.randomBytes(2).toString('hex');

    // Build the access token
    const accessToken = `${orderIdentifier}-${titleSlug}-v${version}-${uniqueSuffix}`;

    // Verify uniqueness (extremely unlikely to collide, but check anyway)
    const existing = db.prepare(`SELECT id FROM proofs WHERE accessToken = ?`).get(accessToken);
    if (existing) {
      // If collision, add more random chars
      return `${accessToken}-${crypto.randomBytes(2).toString('hex')}`;
    }

    return accessToken;
  }

  static create({ orderId, orderItemId, title, fileUrl, fileType, createdBy }) {
    const id = this.generateId();

    // Calculate expiration date (60 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 60);

    // Get the latest version for this order/item
    const latestVersion = db.prepare(`
      SELECT MAX(version) as maxVersion
      FROM proofs
      WHERE orderId = ? AND (orderItemId = ? OR (orderItemId IS NULL AND ? IS NULL))
    `).get(orderId, orderItemId, orderItemId);

    const version = (latestVersion?.maxVersion || 0) + 1;

    // Generate human-readable access token
    const accessToken = this.generateAccessToken(orderId, title, version);

    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO proofs (id, orderId, orderItemId, version, title, fileUrl, fileType, accessToken, expiresAt, createdBy, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, orderId, orderItemId || null, version, title, fileUrl, fileType, accessToken, expiresAt.toISOString(), createdBy, now);

    return this.findById(id);
  }

  static findById(id) {
    return db.prepare(`
      SELECT p.*, u.contactName as creatorName
      FROM proofs p
      LEFT JOIN users u ON p.createdBy = u.id
      WHERE p.id = ?
    `).get(id);
  }

  static findByAccessToken(accessToken) {
    const proof = db.prepare(`
      SELECT p.*, u.contactName as creatorName, o.orderNumber, o.shippingInfo
      FROM proofs p
      LEFT JOIN users u ON p.createdBy = u.id
      LEFT JOIN orders o ON p.orderId = o.id
      WHERE p.accessToken = ?
    `).get(accessToken);

    if (proof) {
      proof.shippingInfo = JSON.parse(proof.shippingInfo || '{}');
      proof.annotations = ProofAnnotation.findByProofId(proof.id);
    }

    return proof;
  }

  static findByOrderId(orderId) {
    const proofs = db.prepare(`
      SELECT p.*, u.contactName as creatorName,
        (SELECT COUNT(*) FROM proof_annotations WHERE proofId = p.id) as annotationCount
      FROM proofs p
      LEFT JOIN users u ON p.createdBy = u.id
      WHERE p.orderId = ?
      ORDER BY p.createdAt DESC
    `).all(orderId);

    // Include annotations for each proof
    proofs.forEach(proof => {
      proof.annotations = ProofAnnotation.findByProofId(proof.id);
    });

    return proofs;
  }

  static getVersionHistory(orderId, orderItemId = null) {
    const query = orderItemId
      ? `SELECT p.*, u.contactName as creatorName,
          (SELECT COUNT(*) FROM proof_annotations WHERE proofId = p.id) as annotationCount
         FROM proofs p
         LEFT JOIN users u ON p.createdBy = u.id
         WHERE p.orderId = ? AND p.orderItemId = ?
         ORDER BY p.version DESC`
      : `SELECT p.*, u.contactName as creatorName,
          (SELECT COUNT(*) FROM proof_annotations WHERE proofId = p.id) as annotationCount
         FROM proofs p
         LEFT JOIN users u ON p.createdBy = u.id
         WHERE p.orderId = ? AND p.orderItemId IS NULL
         ORDER BY p.version DESC`;

    return orderItemId
      ? db.prepare(query).all(orderId, orderItemId)
      : db.prepare(query).all(orderId);
  }

  static signOff(id, { signedOffBy, signature, signatureType }) {
    const stmt = db.prepare(`
      UPDATE proofs
      SET status = 'approved', signedOffAt = ?, signedOffBy = ?, signature = ?, signatureType = ?
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), signedOffBy, signature, signatureType, id);
    return this.findById(id);
  }

  static updateStatus(id, status) {
    const stmt = db.prepare(`UPDATE proofs SET status = ? WHERE id = ?`);
    stmt.run(status, id);
    return this.findById(id);
  }

  static isExpired(proof) {
    if (!proof.expiresAt) return false;
    return new Date(proof.expiresAt) < new Date();
  }

  static delete(id) {
    // Annotations will be deleted via CASCADE
    db.prepare(`DELETE FROM proofs WHERE id = ?`).run(id);
  }
}

export class ProofAnnotation {
  static generateId() {
    return 'ann_' + crypto.randomBytes(12).toString('hex');
  }

  static create({ proofId, type, x, y, width, height, page, comment, authorName, authorEmail }) {
    const id = this.generateId();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO proof_annotations (id, proofId, type, x, y, width, height, page, comment, authorName, authorEmail, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, proofId, type, x, y, width || null, height || null, page || 1, comment, authorName, authorEmail || null, now);

    return this.findById(id);
  }

  static findById(id) {
    return db.prepare(`SELECT * FROM proof_annotations WHERE id = ?`).get(id);
  }

  static findByProofId(proofId) {
    return db.prepare(`
      SELECT * FROM proof_annotations
      WHERE proofId = ?
      ORDER BY createdAt ASC
    `).all(proofId);
  }

  static resolve(id, resolvedBy) {
    const stmt = db.prepare(`
      UPDATE proof_annotations
      SET resolved = 1, resolvedAt = ?, resolvedBy = ?
      WHERE id = ?
    `);

    stmt.run(new Date().toISOString(), resolvedBy, id);
    return this.findById(id);
  }

  static delete(id) {
    db.prepare(`DELETE FROM proof_annotations WHERE id = ?`).run(id);
  }

  // Get unread annotation count for an order (via proofs)
  static getUnreadCountByOrder(orderId) {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count
      FROM proof_annotations pa
      JOIN proofs p ON pa.proofId = p.id
      WHERE p.orderId = ? AND pa.readByAdmin = 0
    `);
    return stmt.get(orderId)?.count || 0;
  }

  // Get unread counts for all orders (for badges)
  static getUnreadCountsByOrder() {
    const stmt = db.prepare(`
      SELECT p.orderId, COUNT(*) as count
      FROM proof_annotations pa
      JOIN proofs p ON pa.proofId = p.id
      WHERE pa.readByAdmin = 0
      GROUP BY p.orderId
    `);
    const rows = stmt.all();
    const counts = {};
    rows.forEach(row => {
      counts[row.orderId] = row.count;
    });
    return counts;
  }

  // Mark all annotations for an order's proofs as read
  static markAsReadByOrder(orderId) {
    const stmt = db.prepare(`
      UPDATE proof_annotations
      SET readByAdmin = 1
      WHERE proofId IN (SELECT id FROM proofs WHERE orderId = ?) AND readByAdmin = 0
    `);
    stmt.run(orderId);
  }

  // Get recent unread annotations (for notifications panel)
  static getRecentUnread(limit = 10) {
    const stmt = db.prepare(`
      SELECT pa.*, p.orderId, p.title as proofTitle, p.version as proofVersion, o.orderNumber
      FROM proof_annotations pa
      JOIN proofs p ON pa.proofId = p.id
      JOIN orders o ON p.orderId = o.id
      WHERE pa.readByAdmin = 0
      ORDER BY pa.createdAt DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }
}

export default { Proof, ProofAnnotation };
