const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const projectService = require('../services/projectService');
const fileService = require('../services/fileService');
const indexingService = require('../services/indexingService');
const deploymentService = require('../services/deploymentService');
const { zipDirectory } = require('../utils/zipUtils');

/**
 * Ensures that the local directory for a project exists on disk.
 * If it doesn't exist, it attempts to restore it from MongoDB and ImageKit CDN.
 */
async function ensureLocalProjectDirectory(id) {
  const targetDir = path.join(config.paths.deployments, id);
  const draftDir = path.join(config.paths.deployments, '.drafts', id);

  if (!fs.existsSync(targetDir)) {
    console.log(`[IDE] Local workspace directory for "${id}" does not exist. Attempting lazy restore...`);
    const deployment = await deploymentService.getDeployment(id);
    if (!deployment) {
      throw new Error(`Project "${id}" does not exist.`);
    }
    if (!deployment.backupUrl) {
      throw new Error(`Project "${id}" does not exist locally and has no backup archives to restore.`);
    }
    await deploymentService.restoreFromBackup(id, deployment.backupUrl);
  }

  // Ensure draftDir exists as a clone of targetDir if missing.
  // Guard: targetDir might still not exist if backupUrl was a local fallback (no CDN to pull from).
  if (!fs.existsSync(draftDir)) {
    if (!fs.existsSync(targetDir)) {
      // Nothing to clone — create both as empty dirs so the IDE doesn't crash
      console.warn(`[IDE] No source files found for "${id}". Creating empty workspace.`);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.mkdirSync(draftDir, { recursive: true });
    } else {
      console.log(`[IDE] Copying live files to drafts for "${id}"...`);
      fs.mkdirSync(draftDir, { recursive: true });

      const copyRecursiveSync = (src, dest) => {
        const exists = fs.existsSync(src);
        const stats = exists && fs.statSync(src);
        const isDirectory = exists && stats.isDirectory();
        if (isDirectory) {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          fs.readdirSync(src).forEach((childItemName) => {
            copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };

      copyRecursiveSync(targetDir, draftDir);
    }
  }
}


/**
 * Creates a brand new project from a template.
 */
async function createProject(req, res, next) {
  try {
    const { name, template } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Project name is required.'
      });
    }

    const project = await projectService.createProjectFromTemplate(name, template || 'vanilla');

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      data: {
        ...project,
        publicUrl: `${baseUrl}/p/${project.id}/`
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create new project.'
    });
  }
}

/**
 * Fetches the recursive file explorer tree for a project.
 */
async function getFiles(req, res, next) {
  try {
    const { id } = req.params;
    await ensureLocalProjectDirectory(id);
    const files = fileService.getFileTree(id);

    return res.status(200).json({
      success: true,
      data: files
    });
  } catch (error) {
    console.error('Error fetching file tree:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 500
    ).json({
      success: false,
      error: error.message || 'Failed to fetch project files.'
    });
  }
}

/**
 * Reads a single file's UTF-8 content.
 */
async function getFileContent(req, res, next) {
  try {
    const { id } = req.params;
    const { path: relativePath } = req.query;

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Query parameter "path" is required.'
      });
    }

    await ensureLocalProjectDirectory(id);
    const file = fileService.getFileContent(id, relativePath);
    return res.status(200).json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Error reading file content:', error);
    return res.status(
      error.message.includes('not found') ||
        error.message.includes('not exist') ? 404 : 500
    ).json({
      success: false,
      error: error.message || 'Failed to read file content.'
    });
  }
}

/**
 * Saves content to a text file.
 */
async function saveFile(req, res, next) {
  try {
    const { id } = req.params;
    const { path: relativePath, content } = req.body;

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Body parameter "path" is required.'
      });
    }

    await ensureLocalProjectDirectory(id);
    const result = fileService.saveFileContent(id, relativePath, content);
    return res.status(200).json({
      success: true,
      message: 'File saved successfully!',
      data: result
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 500
    ).json({
      success: false,
      error: error.message || 'Failed to save file content.'
    });
  }
}

/**
 * Dynamically creates a new empty file or folder.
 */
async function createFileOrFolder(req, res, next) {
  try {
    const { id } = req.params;
    const { path: relativePath, isFolder } = req.body;

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Body parameter "path" is required.'
      });
    }

    await ensureLocalProjectDirectory(id);
    const result = fileService.createFileOrFolder(id, relativePath, !!isFolder);
    return res.status(201).json({
      success: true,
      message: `${isFolder ? 'Folder' : 'File'} created successfully!`,
      data: result
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 400
    ).json({
      success: false,
      error: error.message || 'Failed to create resource.'
    });
  }
}

/**
 * Deletes a file or directory recursively.
 */
async function deleteFileOrFolder(req, res, next) {
  try {
    const { id } = req.params;
    const { path: relativePath } = req.query;

    if (!relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Query parameter "path" is required.'
      });
    }

    await ensureLocalProjectDirectory(id);
    const result = fileService.deleteFileOrFolder(id, relativePath);
    return res.status(200).json({
      success: true,
      message: 'Resource successfully deleted.',
      data: result
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 400
    ).json({
      success: false,
      error: error.message || 'Failed to delete resource.'
    });
  }
}

/**
 * Renames a file or folder.
 */
async function renameFileOrFolder(req, res, next) {
  try {
    const { id } = req.params;
    const { oldPath, newPath } = req.body;

    if (!oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: "oldPath" and "newPath" are required in body.'
      });
    }

    await ensureLocalProjectDirectory(id);
    const result = fileService.renameFileOrFolder(id, oldPath, newPath);
    return res.status(200).json({
      success: true,
      message: 'Resource successfully renamed.',
      data: result
    });
  } catch (error) {
    console.error('Error renaming resource:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 400
    ).json({
      success: false,
      error: error.message || 'Failed to rename resource.'
    });
  }
}

async function searchFiles(req, res, next) {
  try {
    const { id } = req.params;
    const { query } = req.query;

    await ensureLocalProjectDirectory(id);
    const matches = indexingService.searchProjectFiles(id, query);
    return res.status(200).json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error searching files:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 500
    ).json({
      success: false,
      error: 'Lexical search index query failed.'
    });
  }
}

async function deployProject(req, res, next) {
  try {
    const { id } = req.params;

    await ensureLocalProjectDirectory(id);
    console.log(`IDE Direct Redeployment triggered for project: ${id}...`);
    const project = await deploymentService.redeployProject(id);

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const publicUrl = `${baseUrl}/p/${project.id}/`;

    return res.status(200).json({
      success: true,
      message: 'Project redeployed successfully!',
      data: {
        ...project,
        publicUrl
      }
    });
  } catch (error) {
    console.error('Error redeploying project from IDE:', error);
    return res.status(
      error.message.includes('not exist') ||
        error.message.includes('not found') ? 404 : 500
    ).json({
      success: false,
      error: error.message || 'Redeployment build failed.'
    });
  }
}

module.exports = {
  createProject,
  getFiles,
  getFileContent,
  saveFile,
  createFileOrFolder,
  deleteFileOrFolder,
  renameFileOrFolder,
  searchFiles,
  deployProject,
  publishDraftChanges,
  getVersionHistory,
  rollbackToVersion
};

async function publishDraftChanges(req, res, next) {
  try {
    const { id } = req.params;
    await ensureLocalProjectDirectory(id);

    const targetDir = path.join(config.paths.deployments, id);
    const draftDir = path.join(config.paths.deployments, '.drafts', id);

    if (!fs.existsSync(draftDir)) {
      throw new Error('Draft workspace does not exist.');
    }

    let fileCount = 0;
    let hasIndex = false;

    function scan(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          continue;
        }

        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scan(fullPath);
        } else {
          fileCount++;
          if (item.name.toLowerCase() === 'index.html') {
            hasIndex = true;
          }
        }
      }
    }
    scan(draftDir);

    if (!hasIndex) {
      return res.status(400).json({
        success: false,
        error: 'Static Hosting Exception: index.html is missing in your draft folder.'
      });
    }

    if (!fs.existsSync(config.paths.temp)) {
      fs.mkdirSync(config.paths.temp, { recursive: true });
    }
    const { nanoid } = require('nanoid');
    const tempZipPath = path.join(config.paths.temp, `publish-${id}-${nanoid(4)}.zip`);

    console.log(`[PUBLISH] Zipping draft for "${id}"...`);
    await zipDirectory(draftDir, tempZipPath);

    const Deployment = require('../models/Deployment');
    const DeploymentVersion = require('../models/DeploymentVersion');
    const AuditLog = require('../models/AuditLog');

    const deployment = await Deployment.findOne({ id });
    if (!deployment) {
      throw new Error('Deployment not found');
    }

    const versionsCount = await DeploymentVersion.countDocuments({ deploymentId: id });
    const nextVersionNumber = versionsCount + 1;

    console.log(`[PUBLISH] Uploading ZIP to ImageKit for "${id}" (version ${nextVersionNumber})...`);
    let imageKitBackup = { url: '', fileId: '' };
    try {
      const imageKitService = require('../services/imageKitService');
      const uploadResult = await imageKitService.uploadBackup(tempZipPath, `${id}-v${nextVersionNumber}.zip`);
      if (uploadResult && uploadResult.url) {
        imageKitBackup = uploadResult;
        console.log(`[PUBLISH] ImageKit upload success: ${imageKitBackup.url}`);
      }
    } catch (ikError) {
      console.warn(`[PUBLISH] ImageKit backup upload skipped or failed: ${ikError.message}. Proceeding with local release fallback.`);
    }

    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }

    console.log(`[PUBLISH] Overwriting live folder for "${id}"...`);
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.mkdirSync(targetDir, { recursive: true });

    const copyRecursiveSync = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(draftDir, targetDir);

    const fallbackBackupUrl = `/api/deployments/${id}/download`;
    const finalBackupUrl = imageKitBackup.url || deployment.backupUrl || fallbackBackupUrl;
    const finalBackupFileId = imageKitBackup.fileId || deployment.backupFileId || null;

    const versionRecord = await DeploymentVersion.create({
      deploymentId: id,
      versionNumber: nextVersionNumber,
      backupUrl: finalBackupUrl,
      backupFileId: finalBackupFileId,
      fileCount
    });

    deployment.fileCount = fileCount;
    deployment.backupUrl = finalBackupUrl;
    deployment.backupFileId = finalBackupFileId;
    deployment.createdAt = new Date();
    await deployment.save();

    const performedBy = req.user ? req.user.username : 'admin';
    await AuditLog.create({
      action: 'PUBLISH',
      performedBy,
      details: {
        deploymentId: id,
        versionNumber: nextVersionNumber,
        fileCount
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(200).json({
      success: true,
      message: 'Draft published to live production successfully!',
      data: {
        ...deployment.toObject(),
        publicUrl: `${baseUrl}/p/${id}/`,
        version: versionRecord.toObject()
      }
    });
  } catch (error) {
    console.error('[PUBLISH] Error in publishDraftChanges controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to publish draft changes.'
    });
  }
}

async function getVersionHistory(req, res, next) {
  try {
    const { id } = req.params;
    const DeploymentVersion = require('../models/DeploymentVersion');

    const versions = await DeploymentVersion.find({ deploymentId: id })
      .sort({ versionNumber: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Error fetching version logs:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve deployment version history.'
    });
  }
}

async function rollbackToVersion(req, res, next) {
  try {
    const { id } = req.params;
    const { versionNumber } = req.body;

    if (!versionNumber) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: versionNumber is required in rollback body.'
      });
    }

    const Deployment = require('../models/Deployment');
    const DeploymentVersion = require('../models/DeploymentVersion');
    const AuditLog = require('../models/AuditLog');

    const versionRecord = await DeploymentVersion.findOne({ deploymentId: id, versionNumber });
    if (!versionRecord) {
      return res.status(404).json({
        success: false,
        error: `Deployment Version ${versionNumber} not found.`
      });
    }

    const targetDir = path.join(config.paths.deployments, id);
    const draftDir = path.join(config.paths.deployments, '.drafts', id);

    if (fs.existsSync(targetDir)) fs.rmSync(targetDir, { recursive: true, force: true });
    if (fs.existsSync(draftDir)) fs.rmSync(draftDir, { recursive: true, force: true });

    console.log(`[ROLLBACK] Restoring files from version ${versionNumber} CDN archive...`);
    await deploymentService.restoreFromBackup(id, versionRecord.backupUrl);

    fs.mkdirSync(draftDir, { recursive: true });
    const copyRecursiveSync = (src, dest) => {
      if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach((childItemName) => {
          copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(targetDir, draftDir);

    const deployment = await Deployment.findOne({ id });
    if (deployment) {
      deployment.fileCount = versionRecord.fileCount;
      deployment.backupUrl = versionRecord.backupUrl;
      deployment.backupFileId = versionRecord.backupFileId;
      deployment.createdAt = new Date();
      await deployment.save();
    }

    const performedBy = req.user ? req.user.username : 'admin';
    await AuditLog.create({
      action: 'ROLLBACK',
      performedBy,
      details: {
        deploymentId: id,
        versionNumber
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return res.status(200).json({
      success: true,
      message: `Website successfully rolled back to Version ${versionNumber}!`,
      data: {
        ...deployment ? deployment.toObject() : {},
        publicUrl: `${baseUrl}/p/${id}/`
      }
    });
  } catch (error) {
    console.error('[ROLLBACK] Error in rollbackToVersion controller:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to rollback deployment version.'
    });
  }
}

