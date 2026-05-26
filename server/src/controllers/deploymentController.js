const deploymentService = require('../services/deploymentService');
const config = require('../config/config');

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
    const list = deploymentService.getAllDeployments();
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
    const deployment = deploymentService.getDeployment(id);

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

module.exports = {
  deployZIP,
  getDeployments,
  getDeploymentById,
  deleteDeployment,
};
