const mongoose = require('mongoose');

const DeploymentVersionSchema = new mongoose.Schema({
  deploymentId: {
    type: String,
    required: true,
  },
  versionNumber: {
    type: Number,
    required: true,
  },
  backupUrl: {
    type: String,
    default: null,
  },
  backupFileId: {
    type: String,
    default: null,
  },
  fileCount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.DeploymentVersion || mongoose.model('DeploymentVersion', DeploymentVersionSchema);
