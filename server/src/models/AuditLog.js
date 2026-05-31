const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true, // 'MOVE_TO_TRASH', 'RESTORE_FROM_TRASH', 'PERMANENT_DELETE', 'EXPIRE_FROM_TRASH', 'PUBLISH', 'ROLLBACK'
  },
  performedBy: {
    type: String,
    required: true,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
