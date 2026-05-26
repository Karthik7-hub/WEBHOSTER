const fs = require('fs');
const path = require('path');
const https = require('https');
const { nanoid } = require('nanoid');
const unzipper = require('unzipper');
const config = require('../config/config');
const zipSecurity = require('../security/zipSecurity');
const imageKitService = require('./imageKitService');
const connectDB = require('../config/database');
const Deployment = require('../models/Deployment');

// Helper to generate a clean web-friendly slug from zip filename
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

/**
 * Downloads a file from a URL to a local destination path.
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * Safe ZIP Extraction helper.
 * Extracts a local ZIP file to a target directory with path-traversal (ZIP Slip)
 * and executable files injection guards.
 */
async function extractZip(zipPath, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const directory = await unzipper.Open.file(zipPath);
  let fileCount = 0;
  let indexHtmlPath = null;

  for (const entry of directory.files) {
    const normalizedPath = entry.path.replace(/\\/g, '/');

    // ZIP Slip Prevention: Validate target boundary
    if (!zipSecurity.isValidPath(targetDir, normalizedPath)) {
      throw new Error(`Security Exception: Directory traversal attack detected in zip entry: ${entry.path}`);
    }

    if (entry.type === 'File') {
      // Block Executable Extensions
      if (!zipSecurity.isAllowedFileType(normalizedPath)) {
        throw new Error(`Security Exception: Prohibited file extension in zip entry: ${entry.path}`);
      }

      const fullFilePath = path.join(targetDir, normalizedPath);
      const parentDir = path.dirname(fullFilePath);

      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }

      const contentBuffer = await entry.buffer();
      fs.writeFileSync(fullFilePath, contentBuffer);
      fileCount++;

      // Detect index.html (find the shallowest / root level index.html)
      if (normalizedPath.toLowerCase().endsWith('index.html')) {
        if (!indexHtmlPath || normalizedPath.split('/').length < indexHtmlPath.split('/').length) {
          indexHtmlPath = normalizedPath;
        }
      }
    } else if (entry.type === 'Directory') {
      const fullDirPath = path.join(targetDir, normalizedPath);
      if (!fs.existsSync(fullDirPath)) {
        fs.mkdirSync(fullDirPath, { recursive: true });
      }
    }
  }

  return { fileCount, indexHtmlPath };
}

/**
 * Creates a new deployment by unzipping, checking security, uploading backup, and saving metadata.
 */
async function createDeployment(zipPath, originalName) {
  await connectDB();
  const baseSlug = slugify(path.basename(originalName, path.extname(originalName))) || 'project';

  // Find a unique slug ID in MongoDB registry
  let deploymentId = baseSlug;
  let existing = await Deployment.findOne({ id: deploymentId });
  while (existing) {
    const suffix = nanoid(4).toLowerCase();
    deploymentId = `${baseSlug}-${suffix}`;
    existing = await Deployment.findOne({ id: deploymentId });
  }

  const targetDir = path.join(config.paths.deployments, deploymentId);
  let imageKitBackup = null;
  let extracted = false;

  try {
    // 1. Safe extraction locally to verify contents & find index.html
    const { fileCount, indexHtmlPath } = await extractZip(zipPath, targetDir);
    extracted = true;

    if (!indexHtmlPath) {
      throw new Error('Static Hosting Exception: No "index.html" was found in your ZIP archive.');
    }

    // 2. Upload original ZIP backup to ImageKit
    try {
      console.log(`Uploading ZIP backup to ImageKit for deployment: ${deploymentId}...`);
      imageKitBackup = await imageKitService.uploadBackup(zipPath, `${deploymentId}.zip`);
      console.log(`ImageKit backup succeeded: ${imageKitBackup.url}`);
    } catch (ikError) {
      console.error('ImageKit backup upload failed, proceeding without backup:', ikError);
    }

    // 3. Write metadata to MongoDB
    const deployment = await Deployment.create({
      id: deploymentId,
      name: path.basename(originalName, path.extname(originalName)),
      originalFileName: originalName,
      fileCount,
      indexFilePath: indexHtmlPath,
      backupUrl: imageKitBackup ? imageKitBackup.url : null,
      backupFileId: imageKitBackup ? imageKitBackup.fileId : null,
    });

    return deployment.toObject();
  } catch (error) {
    // Cleanup local files if extraction failed
    if (extracted && fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    throw error;
  } finally {
    // Always delete multer temporary ZIP
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}

/**
 * Returns all active deployments in the system.
 */
async function getAllDeployments() {
  await connectDB();
  return await Deployment.find().sort({ createdAt: -1 }).lean();
}

/**
 * Returns metadata of a specific deployment.
 */
async function getDeployment(id) {
  await connectDB();
  return await Deployment.findOne({ id }).lean();
}

/**
 * Restores extracted static files inside `/tmp` from the ImageKit ZIP backup.
 */
async function restoreFromBackup(id, backupUrl) {
  console.log(`Restoring deployment files from ImageKit for: ${id}...`);
  const tempZipPath = path.join(config.paths.temp, `restore-${id}-${nanoid(4)}.zip`);
  const targetDir = path.join(config.paths.deployments, id);

  try {
    // Ensure temp dir exists
    if (!fs.existsSync(config.paths.temp)) {
      fs.mkdirSync(config.paths.temp, { recursive: true });
    }

    // 1. Download ZIP from CDN
    await downloadFile(backupUrl, tempZipPath);

    // 2. Unzip safely
    await extractZip(tempZipPath, targetDir);
    console.log(`Successfully restored static files locally for: ${id}`);
  } catch (error) {
    console.error(`Failed to restore static files for ${id}:`, error);
    // Cleanup partial folder
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    throw error;
  } finally {
    // Cleanup downloaded ZIP
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  }
}

/**
 * Deletes a deployment from MongoDB, ImageKit, and local storage.
 */
async function deleteDeployment(id) {
  await connectDB();
  const deployment = await Deployment.findOne({ id });

  if (!deployment) {
    throw new Error('Deployment not found');
  }

  // 1. Delete extracted files from storage if present
  const targetDir = path.join(config.paths.deployments, id);
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // 2. Delete backup from ImageKit if it exists
  if (deployment.backupFileId) {
    try {
      await imageKitService.deleteBackup(deployment.backupFileId);
    } catch (ikError) {
      console.error(`Failed to delete ImageKit backup for ${id}:`, ikError);
    }
  }

  // 3. Delete record from MongoDB
  await Deployment.deleteOne({ id });
  return true;
}

module.exports = {
  createDeployment,
  getAllDeployments,
  getDeployment,
  restoreFromBackup,
  deleteDeployment,
};
