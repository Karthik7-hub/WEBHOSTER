const mongoose = require('mongoose');

const TrashSchema = new mongoose.Schema({
  folderName: {
    type: String,
    required: true,
  },
  originalId: {
    type: String,
    required: true,
  },
  originalPath: {
    type: String,
    required: true,
  },
  quarantinedPath: {
    type: String,
    required: true,
  },
  sizeBytes: {
    type: Number,
    required: true,
  },
  quarantinedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
  },
});

module.exports = mongoose.models.Trash || mongoose.model('Trash', TrashSchema);
