const ImageKit = require('imagekit');
const fs = require('fs');
const config = require('../config/config');

// Initialize the ImageKit SDK
let imagekit = null;

if (config.imageKit.publicKey && config.imageKit.privateKey && config.imageKit.urlEndpoint) {
  imagekit = new ImageKit({
    publicKey: config.imageKit.publicKey,
    privateKey: config.imageKit.privateKey,
    urlEndpoint: config.imageKit.urlEndpoint,
  });
} else {
  console.warn('ImageKit credentials missing. ZIP backup uploads will fail.');
}

/**
 * Uploads a file to ImageKit for backup storage.
 * 
 * @param {string} filePath - Absolute path to the local file to upload.
 * @param {string} fileName - Destination name on ImageKit.
 * @returns {Promise<Object>} - Promise resolving to ImageKit upload metadata.
 */
async function uploadBackup(filePath, fileName) {
  if (!imagekit) {
    throw new Error('ImageKit client is not initialized due to missing credentials.');
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: fileName,
      folder: '/webhoster_backups',
      useUniqueFileName: false,
      overwriteFile: true,
      purgeCache: true,
    });

    return {
      success: true,
      fileId: response.fileId,
      url: response.url,
      thumbnailUrl: response.thumbnailUrl,
      filePath: response.filePath,
    };
  } catch (error) {
    console.error('ImageKit backup upload failed:', error);
    throw new Error(`ImageKit Upload Error: ${error.message || error}`);
  }
}

/**
 * Deletes a file from ImageKit.
 * 
 * @param {string} fileId - The ImageKit fileId to delete.
 * @returns {Promise<boolean>}
 */
async function deleteBackup(fileId) {
  if (!imagekit || !fileId) return false;
  
  try {
    await imagekit.deleteFile(fileId);
    return true;
  } catch (error) {
    console.error(`Failed to delete ImageKit backup (${fileId}):`, error);
    return false;
  }
}

module.exports = {
  uploadBackup,
  deleteBackup,
};
