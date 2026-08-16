const mongoose = require('mongoose');

const DraftFileSchema = new mongoose.Schema({
  deploymentId: {
    type: String,
    required: true,
    index: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    default: '',
  },
  isBinary: {
    type: Boolean,
    default: false,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

DraftFileSchema.index({ deploymentId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.models.DraftFile || mongoose.model('DraftFile', DraftFileSchema);
