const fs = require('fs');

/**
 * Asynchronously loads archiver and creates a ZipArchive instance safely.
 * Uses dynamic import('archiver') to support ES Module packages in Vercel serverless functions.
 * 
 * @param {Object} options - Archiver options object (e.g. { zlib: { level: 9 } })
 * @returns {Promise<Object>} - Resolves to ZipArchive stream instance
 */
async function createZipArchive(options = { zlib: { level: 9 } }) {
  const mod = await import('archiver');
  const ZipArchive = mod.ZipArchive || 
                     (mod.default && mod.default.ZipArchive) || 
                     (typeof mod.default === 'function' ? mod.default : mod);

  if (typeof ZipArchive === 'function') {
    try {
      return new ZipArchive(options);
    } catch (e) {
      return ZipArchive('zip', options);
    }
  }

  throw new Error('Could not initialize Archiver ZipArchive engine.');
}

/**
 * Archives a source directory into an output ZIP file.
 * Preserves user dotfiles while excluding heavy dependencies and version control dirs.
 * 
 * @param {string} sourceDir - Absolute path to directory to zip.
 * @param {string} outPath - Absolute path where the ZIP file should be written.
 * @returns {Promise<void>}
 */
async function zipDirectory(sourceDir, outPath) {
  const archive = await createZipArchive({ zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);

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
async function streamZipToResponse(sourceDir, res, filename) {
  const archive = await createZipArchive({ zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    res.attachment(filename);

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
