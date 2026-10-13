import { AuditLog } from '../models/AuditLog.js';

export async function audit(req, action, entity, entityId, metadata = {}) {
  await AuditLog.create({
    actor: req.user?._id,
    actorRole: req.user?.role,
    action,
    entity,
    entityId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    metadata
  });
}

