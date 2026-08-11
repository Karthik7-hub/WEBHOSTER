const path = require('path');

/**
 * Validates that an extracted file path resides strictly within the target deployment directory.
 * This blocks the ZIP Slip vulnerability (path traversal via '../../').
 * 
 * @param {string} targetDir - The absolute path of the target deployment directory.
 * @param {string} entryPath - The relative path of the file entry inside the ZIP.
 * @returns {boolean} - True if the path is secure, false otherwise.
 */
function isValidPath(targetDir, entryPath) {
  // Resolve absolute paths
  const resolvedTarget = path.resolve(targetDir);
  const resolvedFilePath = path.resolve(path.join(resolvedTarget, entryPath));

  // Check that the file path starts with the target directory path.
  // Must append path.sep to prevent prefix-bypass: e.g. resolvedTarget="/x/abc"
  // matching resolvedFilePath="/x/abc-evil/payload" via a raw startsWith.
  return resolvedFilePath === resolvedTarget ||
    resolvedFilePath.startsWith(resolvedTarget + path.sep);
}

/**
 * Checks if a file extension is blocked for static hosting.
 * Restricts dangerous executable and server-side script extensions.
 * 
 * @param {string} entryPath - The relative path or name of the file.
 * @returns {boolean} - True if the file type is allowed, false if blocked.
 */
function isAllowedFileType(entryPath) {
  const blockedExtensions = [
    '.exe', '.bat', '.cmd', '.sh', '.bash', '.bin', // Executables
    '.php', '.php3', '.php4', '.php5', '.phtml',    // PHP scripts
    '.asp', '.aspx', '.jsp', '.jspx', '.pl', '.cgi', // Server scripts
    '.htaccess', '.htpasswd',                        // Apache configuration
    '.lnk', '.vbs', '.jse'                           // Windows shortcuts/scripts
  ];

  const ext = path.extname(entryPath).toLowerCase();
  return !blockedExtensions.includes(ext);
}

module.exports = {
  isValidPath,
  isAllowedFileType,
};
