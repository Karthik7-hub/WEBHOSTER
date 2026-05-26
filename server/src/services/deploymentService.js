const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const unzipper = require('unzipper');
const config = require('../config/config');
const zipSecurity = require('../security/zipSecurity');
const imageKitService = require('./imageKitService');

const METADATA_PATH = path.join(config.paths.deployments, 'metadata.json');

// Ensure metadata file exists
if (!fs.existsSync(METADATA_PATH)) {
  fs.writeFileSync(METADATA_PATH, JSON.stringify([], null, 2));
}

/**
 * Reads all deployments from the metadata database.
 */
function readMetadata() {
  try {
    const raw = fs.readFileSync(METADATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading deployment metadata:', error);
    return [];
  }
}

/**
 * Writes deployments list to the metadata database.
 */
function writeMetadata(data) {
  try {
    fs.writeFileSync(METADATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing deployment metadata:', error);
  }
}

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
 * Safe ZIP Extraction and deployment execution service.
 * 
 * @param {string} zipPath - Local path to the uploaded ZIP file.
 * @param {string} originalName - Original name of the uploaded ZIP.
 * @returns {Promise<Object>} - The newly created deployment record metadata.
 */
async function createDeployment(zipPath, originalName) {
  const baseSlug = slugify(path.basename(originalName, path.extname(originalName))) || 'project';
  
  // Verify collision in existing metadata registry and ensure absolute uniqueness
  const deployments = readMetadata();
  let deploymentId = baseSlug;
  let isUnique = !deployments.some((d) => d.id === deploymentId);
  
  if (!isUnique) {
    while (!isUnique) {
      // Generate a clean unique 4-character suffix like 'fer3'
      const suffix = nanoid(4).toLowerCase();
      deploymentId = `${baseSlug}-${suffix}`;
      isUnique = !deployments.some((d) => d.id === deploymentId);
    }
  }

  const targetDir = path.join(config.paths.deployments, deploymentId);

  let fileCount = 0;
  let indexHtmlPath = null;
  let imageKitBackup = null;

  try {
    // 1. Safe path creation
    fs.mkdirSync(targetDir, { recursive: true });

    // 2. Open ZIP using unzipper
    const directory = await unzipper.Open.file(zipPath);

    // 3. Scan and extract with absolute security
    for (const entry of directory.files) {
      // Normalize backslashes (Windows-generated ZIPs compatibility)
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

        // Ensure subdirectories exist
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }

        // Write entry content safely
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

    // 4. Require index.html presence for valid static hosting
    if (!indexHtmlPath) {
      throw new Error('Static Hosting Exception: No "index.html" was found in your ZIP archive.');
    }

    // 5. Upload backup to ImageKit
    try {
      console.log(`Uploading ZIP backup to ImageKit for deployment ${deploymentId}...`);
      imageKitBackup = await imageKitService.uploadBackup(zipPath, `${deploymentId}.zip`);
      console.log(`ImageKit backup succeeded: ${imageKitBackup.url}`);
    } catch (ikError) {
      console.error('ImageKit backup upload failed, proceeding without backup:', ikError);
    }

    // 6. Record Deployment Metadata
    const newDeployment = {
      id: deploymentId,
      name: path.basename(originalName, path.extname(originalName)),
      originalFileName: originalName,
      fileCount: fileCount,
      indexFilePath: indexHtmlPath,
      createdAt: new Date().toISOString(),
      backupUrl: imageKitBackup ? imageKitBackup.url : null,
      backupFileId: imageKitBackup ? imageKitBackup.fileId : null,
    };

    const deployments = readMetadata();
    deployments.unshift(newDeployment);
    writeMetadata(deployments);

    return newDeployment;
  } catch (error) {
    // CLEANUP: If error occurs, recursively delete the extracted directory
    if (fs.existsSync(targetDir)) {
      fs.rmSync(targetDir, { recursive: true, force: true });
    }
    throw error;
  } finally {
    // CLEANUP: Delete temporary zip file
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }
  }
}

/**
 * Returns all active deployments in the system.
 */
function getAllDeployments() {
  return readMetadata();
}

/**
 * Returns metadata of a specific deployment.
 */
function getDeployment(id) {
  const deployments = readMetadata();
  return deployments.find((d) => d.id === id) || null;
}

/**
 * Deletes a deployment from storage and clears metadata database.
 */
async function deleteDeployment(id) {
  const deployments = readMetadata();
  const deploymentIndex = deployments.findIndex((d) => d.id === id);

  if (deploymentIndex === -1) {
    throw new Error('Deployment not found');
  }

  const deployment = deployments[deploymentIndex];

  // 1. Delete extracted files from storage
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

  // 3. Remove entry from deployments array
  deployments.splice(deploymentIndex, 1);
  writeMetadata(deployments);

  return true;
}

module.exports = {
  createDeployment,
  getAllDeployments,
  getDeployment,
  deleteDeployment,
};
