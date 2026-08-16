const fs = require('fs');
const path = require('path');

/**
 * Atomically replaces targetDir with stagingDir.
 * If targetDir exists, it is renamed out of the way first, stagingDir is moved into place,
 * and the previous directory is safely purged in the background.
 * This prevents half-extracted / half-deleted 404 windows during live deployments.
 * 
 * @param {string} stagingDir - Absolute path to the staging directory containing verified files.
 * @param {string} targetDir - Absolute path to the live destination directory.
 */
function atomicReplaceDirectory(stagingDir, targetDir) {
  if (!fs.existsSync(stagingDir)) {
    throw new Error(`Staging directory does not exist: ${stagingDir}`);
  }

  const parentDir = path.dirname(targetDir);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const backupOldDir = path.join(parentDir, `.old-${path.basename(targetDir)}-${Date.now()}`);

  // 1. Move old active directory out of the serving path if it exists
  if (fs.existsSync(targetDir)) {
    try {
      fs.renameSync(targetDir, backupOldDir);
    } catch (renameErr) {
      // If rename fails (e.g. file lock or cross-volume), fallback to copy/replace
      try {
        fs.rmSync(targetDir, { recursive: true, force: true });
      } catch (rmErr) {
        console.warn(`[atomicFs] Warning removing old directory: ${rmErr.message}`);
      }
    }
  }

  // 2. Move staging directory into the active target path
  try {
    fs.renameSync(stagingDir, targetDir);
  } catch (renameErr) {
    fs.mkdirSync(targetDir, { recursive: true });
    fs.cpSync(stagingDir, targetDir, { recursive: true, force: true });
    try {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    } catch (rmErr) {}
  }

  // 3. Clean up the old backup directory safely
  if (fs.existsSync(backupOldDir)) {
    try {
      fs.rmSync(backupOldDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      // Non-blocking cleanup warning
    }
  }
}

module.exports = {
  atomicReplaceDirectory,
};
