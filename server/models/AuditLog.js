import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: String,
    action: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: mongoose.Schema.Types.ObjectId },
    ip: String,
    userAgent: String,
    metadata: { type: mongoose.Schema.Types.Mixed }
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', schema);

