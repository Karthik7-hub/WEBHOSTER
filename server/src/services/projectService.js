const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const config = require('../config/config');
const connectDB = require('../config/database');
const Deployment = require('../models/Deployment');
const DeploymentVersion = require('../models/DeploymentVersion');
const imageKitService = require('./imageKitService');
const { getTemplateFiles } = require('../templates');
const { zipDirectory } = require('../utils/zipUtils');

// Helper to generate a clean web-friendly slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Creates a new project from a template.
 */
async function createProjectFromTemplate(projectName, templateName = 'vanilla') {
  await connectDB();
  const cleanName = projectName.trim() || 'Untitled Project';
  const baseSlug = slugify(cleanName) || 'project';

  // Generate a unique project ID
  let deploymentId = baseSlug;
  let existing = await Deployment.findOne({ id: deploymentId });
  while (existing) {
    const suffix = nanoid(4).toLowerCase();
    deploymentId = `${baseSlug}-${suffix}`;
    existing = await Deployment.findOne({ id: deploymentId });
  }

  const targetDir = path.join(config.paths.deployments, deploymentId);
  const draftDir = path.join(config.paths.deployments, '.drafts', deploymentId);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(draftDir, { recursive: true });

  const files = getTemplateFiles(templateName, cleanName);
  let fileCount = 0;

  // Write files to both live and drafts folders
  for (const [relativePath, content] of Object.entries(files)) {
    // Write to live targetDir
    const fullPath = path.join(targetDir, relativePath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');

    // Write to draftDir
    const draftPath = path.join(draftDir, relativePath);
    const draftParent = path.dirname(draftPath);
    if (!fs.existsSync(draftParent)) {
      fs.mkdirSync(draftParent, { recursive: true });
    }
    fs.writeFileSync(draftPath, content, 'utf8');

    fileCount++;
  }

  // Seed MongoDB DraftFile documents
  try {
    const DraftFile = require('../models/DraftFile');
    for (const [relativePath, content] of Object.entries(files)) {
      await DraftFile.findOneAndUpdate(
        { deploymentId, filePath: relativePath },
        { content, isBinary: false, updatedAt: new Date() },
        { upsert: true }
      );
    }
  } catch (dfErr) {
    console.warn('[TEMPLATE] DraftFile seed warning:', dfErr.message);
  }

  // Generate initial ZIP backup and upload to ImageKit CDN
  const tempZipPath = path.join(config.paths.deployments, `temp-${deploymentId}-${Date.now()}.zip`);

  let imageKitBackup = { url: null, fileId: null };
  try {
    console.log(`[TEMPLATE BACKUP] Zipping template files for "${deploymentId}"...`);
    await zipDirectory(targetDir, tempZipPath);

    console.log(`[TEMPLATE BACKUP] Uploading initial template archive to ImageKit CDN for "${deploymentId}"...`);
    const uploadResult = await imageKitService.uploadBackup(tempZipPath, `${deploymentId}-v1.zip`);
    if (uploadResult && uploadResult.url) {
      imageKitBackup = uploadResult;
      console.log(`[TEMPLATE BACKUP] ImageKit upload success: ${imageKitBackup.url}`);
    }
  } catch (ikError) {
    console.warn(`[TEMPLATE BACKUP] ImageKit backup upload notice: ${ikError.message}. Using local dynamic endpoint fallback.`);
  } finally {
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  }

  const fallbackBackupUrl = `/api/deployments/${deploymentId}/download`;
  const finalBackupUrl = imageKitBackup.url || fallbackBackupUrl;

  // Write .deploy_version file in targetDir
  const versionFilePath = path.join(targetDir, '.deploy_version');
  fs.writeFileSync(versionFilePath, finalBackupUrl || `${Date.now()}`, 'utf8');

  // Write record to database with ImageKit CDN backup URL
  const deployment = await Deployment.create({
    id: deploymentId,
    name: cleanName,
    originalFileName: `template-${templateName}.zip`,
    fileCount,
    indexFilePath: 'index.html',
    backupUrl: finalBackupUrl,
    backupFileId: imageKitBackup.fileId || null
  });

  await DeploymentVersion.create({
    deploymentId: deploymentId,
    versionNumber: 1,
    backupUrl: finalBackupUrl,
    backupFileId: imageKitBackup.fileId || null,
    fileCount
  });

  return deployment.toObject();
}

module.exports = {
  createProjectFromTemplate
};
