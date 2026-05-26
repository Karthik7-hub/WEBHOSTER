const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  fileCount: {
    type: Number,
    required: true,
  },
  indexFilePath: {
    type: String,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent model overwrite in development HMR
module.exports = mongoose.models.Deployment || mongoose.model('Deployment', DeploymentSchema);
