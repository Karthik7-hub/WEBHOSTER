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
 * Helper to zip a directory.
 */
async function zipDirectory(sourceDir, outPath) {
  const { ZipArchive } = await import('archiver');
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = new ZipArchive({
      zlib: { level: 9 }
    });

    output.on('close', () => {
      resolve();
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);
    
    // Append files from source directory, but exclude node_modules or system files
    archive.glob('**/*', {
      cwd: sourceDir,
      ignore: ['**/node_modules/**', '**/.*/**']
    });

    archive.finalize();
  });
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

  const Trash = require('../models/Trash');
  const AuditLog = require('../models/AuditLog');

  // 1. Calculate folder size and move it to trash directory
  const targetDir = path.join(config.paths.deployments, id);
  const trashDir = path.join(config.paths.deployments, '.trash');
  
  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true });
  }

  const timestamp = Date.now();
  const destFolderName = `${id}-${timestamp}`;
  const destPath = path.join(trashDir, destFolderName);

  let folderSize = 0;
  if (fs.existsSync(targetDir)) {
    folderSize = getDirectorySize(targetDir);
    try {
      fs.renameSync(targetDir, destPath);
    } catch (err) {
      console.error(`Failed to move active folder ${id} to Trash:`, err);
      // Fallback: if rename fails, delete it directly
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.error(`Failed to force delete folder ${id} after failed rename:`, rmErr);
        // Note: Even if folder deletion physically fails due to Windows lock, we will proceed to delete
        // the record from MongoDB. Active edge routing for this ID will immediately stop (returning 404),
        // releasing any OS file locks, and the next Inactive Files Cleanup sweep will clean up the folder.
      }
    }
  }

  // 2. Create Trash Entry containing the full project metadata
  await Trash.create({
    folderName: destFolderName,
    originalId: id,
    originalPath: targetDir,
    quarantinedPath: destPath,
    sizeBytes: folderSize,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    metadata: deployment.toObject()
  });

  // 3. Create Audit Log
  await AuditLog.create({
    action: 'MOVE_TO_TRASH',
    performedBy: 'System User',
    details: {
      originalId: id,
      folderName: destFolderName,
      sizeBytes: folderSize
    }
  });

  // 4. Delete record from MongoDB active collections
  await Deployment.deleteOne({ id });
  return true;
}

/**
 * Repackages active project directories and publishes direct updates.
 */
async function redeployProject(id) {
  await connectDB();
  const deployment = await Deployment.findOne({ id });

  if (!deployment) {
    throw new Error('Deployment not found');
  }

  const targetDir = path.join(config.paths.deployments, id);
  if (!fs.existsSync(targetDir)) {
    throw new Error('Project directory does not exist locally.');
  }

  // Count files recursively and find index.html path
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
  scan(targetDir);

  if (!hasIndex) {
    throw new Error('Static Hosting Exception: index.html is missing in the project folder.');
  }

  // Ensure temp path exists
  if (!fs.existsSync(config.paths.temp)) {
    fs.mkdirSync(config.paths.temp, { recursive: true });
  }

  const tempZipPath = path.join(config.paths.temp, `redeploy-${id}-${nanoid(4)}.zip`);

  try {
    // 1. Zipping folder
    console.log(`Zipping workspace folder for project: ${id}...`);
    await zipDirectory(targetDir, tempZipPath);

    // 2. Upload zip backup to ImageKit
    console.log(`Uploading ZIP redeployment archive to CDN for project: ${id}...`);
    const imageKitBackup = await imageKitService.uploadBackup(tempZipPath, `${id}.zip`);
    console.log(`Redeployment backup successfully uploaded to CDN: ${imageKitBackup.url}`);

    // 3. Delete previous ImageKit backup if existed
    if (deployment.backupFileId) {
      try {
        await imageKitService.deleteBackup(deployment.backupFileId);
      } catch (ikError) {
        console.error('Warning: Failed to delete previous ImageKit backup file:', ikError);
      }
    }

    // 4. Update deployment record
    deployment.fileCount = fileCount;
    deployment.backupUrl = imageKitBackup.url;
    deployment.backupFileId = imageKitBackup.fileId;
    deployment.createdAt = new Date(); // Refresh deployed timestamp
    
    await deployment.save();

    return deployment.toObject();
  } catch (error) {
    console.error(`Failed to redeploy project ${id}:`, error);
    throw error;
  } finally {
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  }
}

module.exports = {
  createDeployment,
  getAllDeployments,
  getDeployment,
  restoreFromBackup,
  deleteDeployment,
  redeployProject,
  getDirectorySize,
  getStorageAnalytics,
  moveInactiveToTrash,
  restoreTrashFolder,
  deleteTrashFolderPermanently,
  expireTrashItems
};

function getDirectorySize(dirPath) {
  if (!fs.existsSync(dirPath)) return 0;
  let totalSize = 0;
  
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      
      if (item.name === '.trash' || item.name.startsWith('.')) {
        continue;
      }
      
      if (item.isDirectory()) {
        totalSize += getDirectorySize(fullPath);
      } else {
        totalSize += fs.statSync(fullPath).size;
      }
    }
  } catch (err) {
    console.error(`Error calculating size of ${dirPath}:`, err);
  }
  
  return totalSize;
}

async function getStorageAnalytics() {
  await connectDB();
  
  const deploymentsDir = config.paths.deployments;
  const uploadsDir = config.paths.uploads;
  const tempDir = config.paths.temp;
  const trashDir = path.join(deploymentsDir, '.trash');

  const deploymentsSize = getDirectorySize(deploymentsDir);
  const uploadsSize = getDirectorySize(uploadsDir);
  const tempSize = getDirectorySize(tempDir);
  const trashSize = getDirectorySize(trashDir);

  let staleFolders = [];
  if (fs.existsSync(deploymentsDir)) {
    const activeDeployments = await Deployment.find({}, 'id').lean();
    const activeIds = new Set(activeDeployments.map(d => d.id));
    
    const localDirs = fs.readdirSync(deploymentsDir, { withFileTypes: true })
      .filter(item => item.isDirectory())
      .map(item => item.name);

    for (const dirName of localDirs) {
      if (dirName.startsWith('.') || dirName === 'node_modules' || dirName === '.trash') {
        continue;
      }
      if (!activeIds.has(dirName)) {
        const fullPath = path.join(deploymentsDir, dirName);
        const size = getDirectorySize(fullPath);
        staleFolders.push({
          folderName: dirName,
          sizeBytes: size,
          path: fullPath
        });
      }
    }
  }

  const Trash = require('../models/Trash');
  const deletedItems = await Trash.find().sort({ quarantinedAt: -1 }).lean();

  return {
    deploymentsSize,
    uploadsSize,
    tempSize,
    trashSize,
    staleFolders,
    deletedItems
  };
}

async function moveInactiveToTrash(dryRun, performedBy = 'System Admin') {
  await connectDB();
  const analytics = await getStorageAnalytics();
  const staleFolders = analytics.staleFolders;

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      purgedCount: staleFolders.length,
      reclaimableSize: staleFolders.reduce((acc, curr) => acc + curr.sizeBytes, 0),
      purgedFolders: staleFolders.map(f => f.folderName)
    };
  }

  const Trash = require('../models/Trash');
  const AuditLog = require('../models/AuditLog');
  const deploymentsDir = config.paths.deployments;
  const trashDir = path.join(deploymentsDir, '.trash');

  if (!fs.existsSync(trashDir)) {
    fs.mkdirSync(trashDir, { recursive: true });
  }

  let purgedCount = 0;
  let reclaimedSize = 0;
  const purgedFolders = [];

  for (const folder of staleFolders) {
    const timestamp = Date.now();
    const folderName = folder.folderName;
    const destFolderName = `${folderName}-${timestamp}`;
    const destPath = path.join(trashDir, destFolderName);
    
    try {
      fs.renameSync(folder.path, destPath);
      
      await Trash.create({
        folderName: destFolderName,
        originalId: folderName,
        originalPath: folder.path,
        quarantinedPath: destPath,
        sizeBytes: folder.sizeBytes,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      purgedCount++;
      reclaimedSize += folder.sizeBytes;
      purgedFolders.push(folderName);
    } catch (err) {
      console.error(`Failed to move inactive folder ${folderName} to Trash:`, err);
    }
  }

  if (purgedCount > 0) {
    await AuditLog.create({
      action: 'MOVE_TO_TRASH',
      performedBy,
      details: {
        purgedCount,
        reclaimedSize,
        purgedFolders
      }
    });
  }

  return {
    success: true,
    dryRun: false,
    purgedCount,
    reclaimedSize,
    purgedFolders
  };
}

async function restoreTrashFolder(id, performedBy = 'System Admin') {
  await connectDB();
  const Trash = require('../models/Trash');
  const AuditLog = require('../models/AuditLog');

  const item = await Trash.findById(id);
  if (!item) {
    throw new Error('Deleted item not found in Trash Bin');
  }

  const originalPath = item.originalPath;
  const quarantinedPath = item.quarantinedPath;

  if (!fs.existsSync(quarantinedPath)) {
    throw new Error('Deleted folder does not exist on disk anymore.');
  }

  const deploymentsDir = config.paths.deployments;
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  fs.renameSync(quarantinedPath, originalPath);

  // Restore the active database Deployment record if metadata exists
  if (item.metadata) {
    const Deployment = require('../models/Deployment');
    await Deployment.deleteOne({ id: item.originalId });
    await Deployment.create(item.metadata);
  }

  await Trash.deleteOne({ _id: id });

  await AuditLog.create({
    action: 'RESTORE_FROM_TRASH',
    performedBy,
    details: {
      originalId: item.originalId,
      folderName: item.folderName,
      sizeBytes: item.sizeBytes
    }
  });

  return {
    success: true,
    originalId: item.originalId
  };
}

async function deleteTrashFolderPermanently(id, performedBy = 'System Admin') {
  await connectDB();
  const Trash = require('../models/Trash');
  const AuditLog = require('../models/AuditLog');

  const item = await Trash.findById(id);
  if (!item) {
    throw new Error('Deleted item not found in Trash Bin');
  }

  const quarantinedPath = item.quarantinedPath;
  if (fs.existsSync(quarantinedPath)) {
    fs.rmSync(quarantinedPath, { recursive: true, force: true });
  }

  await Trash.deleteOne({ _id: id });

  // Delete backup from ImageKit if it exists
  if (item.metadata && item.metadata.backupFileId) {
    try {
      await imageKitService.deleteBackup(item.metadata.backupFileId);
    } catch (ikError) {
      console.error(`Failed to delete ImageKit backup for ${item.originalId} during permanent wipe:`, ikError);
    }
  }

  await AuditLog.create({
    action: 'PERMANENT_DELETE',
    performedBy,
    details: {
      originalId: item.originalId,
      folderName: item.folderName,
      sizeBytes: item.sizeBytes
    }
  });

  return {
    success: true
  };
}

async function expireTrashItems() {
  try {
    await connectDB();
    const Trash = require('../models/Trash');
    const AuditLog = require('../models/AuditLog');

    const now = new Date();
    const expiredItems = await Trash.find({ expiresAt: { $lte: now } });

    if (expiredItems.length === 0) return;

    console.log(`[CLEANUP] Found ${expiredItems.length} expired items in Trash Bin to delete permanently.`);
    
    let expiredCount = 0;
    let expiredSize = 0;
    const expiredFolders = [];

    for (const item of expiredItems) {
      if (fs.existsSync(item.quarantinedPath)) {
        fs.rmSync(item.quarantinedPath, { recursive: true, force: true });
      }
      await Trash.deleteOne({ _id: item._id });
      expiredCount++;
      expiredSize += item.sizeBytes;
      expiredFolders.push(item.originalId);
    }

    await AuditLog.create({
      action: 'EXPIRE_FROM_TRASH',
      performedBy: 'System Cron Worker',
      details: {
        expiredCount,
        expiredSize,
        expiredFolders
      }
    });

    console.log(`[CLEANUP] Successfully purged ${expiredCount} expired items from Trash Bin, reclaiming ${expiredSize} bytes.`);
  } catch (err) {
    console.error('[CLEANUP] Error during expired Trash items purge:', err);
  }
}

// Background scheduler running periodically
setInterval(() => {
  expireTrashItems();
}, 24 * 60 * 60 * 1000); // 24 Hours

// Startup execution (debounced by 5s)
setTimeout(() => {
  expireTrashItems();
}, 5000);
