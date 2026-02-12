import { AuditLog } from '../models/AuditLog.js';

export function logAudit(req, { action, category, targetId, targetType, details }) {
  try {
    AuditLog.create({
      action,
      category,
      userId: req.user?.id || null,
      targetId: targetId || null,
      targetType: targetType || null,
      details: details || null,
      ipAddress: req.ip || req.connection?.remoteAddress || null,
    });
  } catch (error) {
    // Audit logging must never break a request
    console.error('Audit log error:', error.message);
  }
}
