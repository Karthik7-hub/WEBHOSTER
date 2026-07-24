const express = require('express');
const multer = require('multer');
const path = require('path');
const config = require('../config/config');
const controller = require('../controllers/deploymentController');

const router = express.Router();

// 1. Configure Multer Disk Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.uploads);
  },
  filename: (req, file, cb) => {
    // Generate unique temporary filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// 2. Configure Multer Filters
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  // Verify standard ZIP extensions
  if (ext !== '.zip') {
    return cb(new Error('Validation Error: Only ZIP files (.zip) are allowed.'), false);
  }

  // Validate ZIP MIME types
  const allowedMimeTypes = [
    'application/zip',
    'application/octet-stream',
    'application/x-zip-compressed',
    'application/x-zip',
    'multipart/x-zip',
    'application/x-compressed',
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    // Some browsers or OS configurations use generic octet-stream for zip, we allow it but verify extension
    if (file.mimetype !== 'application/octet-stream') {
      return cb(new Error(`Validation Error: Invalid MIME Type (${file.mimetype}). ZIP file required.`), false);
    }
  }

  cb(null, true);
};

// 3. Initialize Multer Middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB size limit
  },
});

const requireAdminAuth = require('../middleware/authMiddleware');

// 4. Register Endpoints
router.post('/deploy', requireAdminAuth, upload.single('file'), controller.deployZIP);
router.get('/deployments', requireAdminAuth, controller.getDeployments);
router.get('/stats', requireAdminAuth, controller.getPlatformStats);
router.get('/deployments/storage-analytics', requireAdminAuth, controller.getPlatformStorageAnalytics);
router.post('/deployments/cleanup-stale', requireAdminAuth, controller.cleanupStaleDeployments);
router.post('/deployments/trash/:id/restore', requireAdminAuth, controller.restoreTrash);
router.delete('/deployments/trash/:id/delete-permanently', requireAdminAuth, controller.deleteTrashPermanently);
router.get('/deployments/:id', requireAdminAuth, controller.getDeploymentById);
router.get('/deployments/:id/logs', requireAdminAuth, controller.getDeploymentLogs);
router.get('/deployments/:id/download', requireAdminAuth, controller.downloadDeploymentZIP);
router.delete('/deployments/:id', requireAdminAuth, controller.deleteDeployment);

module.exports = router;

