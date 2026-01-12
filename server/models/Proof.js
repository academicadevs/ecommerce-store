import db from '../utils/database.js';
import crypto from 'crypto';

export class Proof {
  static generateId() {
    return 'prf_' + crypto.randomBytes(12).toString('hex');
  }

  static generateAccessToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static create({ orderId, orderItemId, title, fileUrl, fileType, createdBy }) {
    const id = this.generateId();
    const accessToken = this.generateAccessToken();

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

    const stmt = db.prepare(`
      INSERT INTO proofs (id, orderId, orderItemId, version, title, fileUrl, fileType, accessToken, expiresAt, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, orderId, orderItemId || null, version, title, fileUrl, fileType, accessToken, expiresAt.toISOString(), createdBy);

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

    const stmt = db.prepare(`
      INSERT INTO proof_annotations (id, proofId, type, x, y, width, height, page, comment, authorName, authorEmail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, proofId, type, x, y, width || null, height || null, page || 1, comment, authorName, authorEmail || null);

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
}

export default { Proof, ProofAnnotation };
