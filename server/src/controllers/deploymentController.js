const deploymentService = require('../services/deploymentService');
const config = require('../config/config');
const Deployment = require('../models/Deployment');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Handles ZIP file upload and triggers deployment service extraction.
 */
async function deployZIP(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: No file uploaded. Please upload a static ZIP archive.',
      });
    }

    console.log(`Processing upload of file: ${req.file.originalname}`);

    // Call service to safely extract, backup, and store deployment
    const deployment = await deploymentService.createDeployment(req.file.path, req.file.originalname);
    
    // Generate public URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}/p/${deployment.id}/`;

    return res.status(201).json({
      success: true,
      message: 'Website deployed successfully!',
      data: {
        ...deployment,
        publicUrl,
      },
    });
  } catch (error) {
    console.error('Error in deployZIP controller:', error);
    return res.status(error.message.includes('Security') ? 400 : 500).json({
      success: false,
      error: error.message || 'An unexpected error occurred during deployment.',
    });
  }
}

/**
 * Retrieves all active deployments.
 */
async function getDeployments(req, res, next) {
  try {
    const list = await deploymentService.getAllDeployments();
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const enrichedList = list.map((item) => ({
      ...item,
      publicUrl: `${baseUrl}/p/${item.id}/`,
    }));

    return res.status(200).json({
      success: true,
      data: enrichedList,
    });
  } catch (error) {
    console.error('Error fetching deployments list:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deployments list.',
    });
  }
}

/**
 * Retrieves a single deployment by ID.
 */
async function getDeploymentById(req, res, next) {
  try {
    const { id } = req.params;
    const deployment = await deploymentService.getDeployment(id);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        error: `Deployment with ID "${id}" was not found.`,
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;

    return res.status(200).json({
      success: true,
      data: {
        ...deployment,
        publicUrl: `${baseUrl}/p/${deployment.id}/`,
      },
    });
  } catch (error) {
    console.error('Error fetching deployment details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch deployment details.',
    });
  }
}

/**
 * Deletes an active deployment.
 */
async function deleteDeployment(req, res, next) {
  try {
    const { id } = req.params;
    
    await deploymentService.deleteDeployment(id);

    return res.status(200).json({
      success: true,
      message: `Deployment "${id}" successfully deleted.`,
    });
  } catch (error) {
    console.error('Error deleting deployment:', error);
    return res.status(error.message === 'Deployment not found' ? 404 : 500).json({
      success: false,
      error: error.message || 'Failed to delete deployment.',
    });
  }
}

/**
 * Retrieves aggregate platform statistics.
 */
async function getPlatformStats(req, res, next) {
  try {
    const totalProjects = await Deployment.countDocuments();
    
    const stats = await Deployment.aggregate([
      {
        $group: {
          _id: null,
          totalFiles: { $sum: '$fileCount' },
        },
      },
    ]);
    const totalFiles = stats.length > 0 ? stats[0].totalFiles : 0;

    const latestDeployment = await Deployment.findOne().sort({ createdAt: -1 });
    const latestDeployAt = latestDeployment ? latestDeployment.createdAt : null;

    return res.status(200).json({
      success: true,
      data: {
        totalProjects,
        totalFiles,
        latestDeployAt,
      },
    });
  } catch (error) {
    console.error('Error fetching platform statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch platform statistics.',
    });
  }
}

module.exports = {
  deployZIP,
  getDeployments,
  getDeploymentById,
  deleteDeployment,
  getPlatformStats,
  getPlatformStorageAnalytics,
  cleanupStaleDeployments,
  restoreTrash,
  deleteTrashPermanently,
  downloadDeploymentZIP
};

async function getPlatformStorageAnalytics(req, res, next) {
  try {
    const stats = await deploymentService.getStorageAnalytics();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching platform storage analytics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch platform storage analytics.',
    });
  }
}

async function cleanupStaleDeployments(req, res, next) {
  try {
    const dryRun = req.query.dryRun === 'true';
    const performedBy = req.user ? req.user.username : 'admin';

    const result = await deploymentService.moveInactiveToTrash(dryRun, performedBy);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in cleanupStaleDeployments controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to trigger platform cleanup.',
    });
  }
}

async function restoreTrash(req, res, next) {
  try {
    const { id } = req.params;
    const performedBy = req.user ? req.user.username : 'admin';

    const result = await deploymentService.restoreTrashFolder(id, performedBy);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in restoreTrash controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore deleted deployment folder.',
    });
  }
}

async function deleteTrashPermanently(req, res, next) {
  try {
    const { id } = req.params;
    const performedBy = req.user ? req.user.username : 'admin';

    const result = await deploymentService.deleteTrashFolderPermanently(id, performedBy);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in deleteTrashPermanently controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to permanently delete deployment folder.',
    });
  }
}

async function downloadDeploymentZIP(req, res, next) {
  try {
    const { id } = req.params;
    const deployment = await Deployment.findOne({ id });
    if (!deployment) {
      return res.status(404).json({ success: false, error: 'Project not found.' });
    }

    const targetDir = path.join(config.paths.deployments, id);
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ success: false, error: 'Project files not found on disk.' });
    }

    res.attachment(`${deployment.name || id}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);
    archive.directory(targetDir, false);
    await archive.finalize();
  } catch (error) {
    console.error('Error downloading deployment ZIP:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, error: 'Failed to package project files.' });
    }
  }
}

