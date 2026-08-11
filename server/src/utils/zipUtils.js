const fs = require('fs');
const archiver = require('archiver');
const ZipArchive = archiver.ZipArchive || (archiver.default && archiver.default.ZipArchive);

/**
 * Creates a ZipArchive instance using Archiver 8.0.0+ official API.
 * 
 * @param {Object} options - Archiver options object (e.g. { zlib: { level: 9 } })
 * @returns {Object} - ZipArchive stream instance
 */
function createZipArchive(options = { zlib: { level: 9 } }) {
  if (ZipArchive) {
    return new ZipArchive(options);
  }
  if (typeof archiver === 'function') {
    return archiver('zip', options);
  }
  throw new Error('Could not initialize Archiver 8.0.0 ZipArchive engine.');
}

/**
 * Archives a source directory into an output ZIP file.
 * Preserves user dotfiles while excluding heavy dependencies and version control dirs.
 * 
 * @param {string} sourceDir - Absolute path to directory to zip.
 * @param {string} outPath - Absolute path where the ZIP file should be written.
 * @returns {Promise<void>}
 */
function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = createZipArchive({ zlib: { level: 9 } });

    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.glob('**/*', {
      cwd: sourceDir,
      dot: true,
      ignore: ['**/node_modules/**', '**/.git/**']
    });
    archive.finalize();
  });
}

/**
 * Pipes a zipped directory stream directly to an HTTP Express response defensibly.
 * Propagates streaming errors and aborts archive generation if client disconnects early.
 * 
 * @param {string} sourceDir - Absolute path of directory to zip.
 * @param {Object} res - Express Response object.
 * @param {string} filename - Attachment filename for the HTTP response.
 * @returns {Promise<void>}
 */
function streamZipToResponse(sourceDir, res, filename) {
  return new Promise((resolve, reject) => {
    res.attachment(filename);
    const archive = createZipArchive({ zlib: { level: 9 } });

    archive.on('error', (err) => {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Failed to package project files.' });
      } else {
        res.destroy(err);
      }
      reject(err);
    });

    res.on('close', () => {
      if (!res.writableEnded) {
        try {
          archive.abort();
        } catch (e) {
          // Ignore abort errors if stream finished
        }
      }
    });

    res.on('finish', resolve);

    archive.pipe(res);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

module.exports = {
  createZipArchive,
  zipDirectory,
  streamZipToResponse,
};
