const fs = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Ensures that a given relative path is safely locked inside the deployment sandbox.
 * Prevents Directory Traversal (Zip Slip / relative path escapes).
 */
function ensureSafePath(deploymentId, relativePath = '') {
  if (!deploymentId) {
    throw new Error('Validation Error: Deployment ID is required.');
  }
  
  const baseDir = path.resolve(path.join(config.paths.deployments, '.drafts', deploymentId));
  const absolutePath = path.resolve(path.join(baseDir, relativePath));
  
  if (!absolutePath.startsWith(baseDir)) {
    throw new Error('Security Exception: Access denied outside sandbox boundary.');
  }
  
  return { absolutePath, baseDir };
}


/**
 * Scans the project directory recursively and returns a tree structure.
 */
function getFileTree(deploymentId) {
  const { baseDir } = ensureSafePath(deploymentId);
  
  if (!fs.existsSync(baseDir)) {
    throw new Error(`Project directory for "${deploymentId}" does not exist.`);
  }

  function recurse(dir, relativeDir = '') {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    const nodes = [];

    for (const item of items) {
      // Ignore system files, git, node_modules
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }

      const relativePath = path.join(relativeDir, item.name).replace(/\\/g, '/');
      const absolutePath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        nodes.push({
          name: item.name,
          path: relativePath,
          type: 'directory',
          children: recurse(absolutePath, relativePath)
        });
      } else {
        const stats = fs.statSync(absolutePath);
        nodes.push({
          name: item.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          updatedAt: stats.mtime
        });
      }
    }

    // Sort: directories first, then files alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  return recurse(baseDir);
}

/**
 * Checks if a file is a binary asset (image, font, zip, etc.)
 */
function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', 
    '.woff', '.woff2', '.ttf', '.otf', '.eot', 
    '.zip', '.pdf', '.mp3', '.mp4'
  ];
  return binaryExtensions.includes(ext);
}

/**
 * Reads text content of a file.
 */
function getFileContent(deploymentId, relativePath) {
  const { absolutePath } = ensureSafePath(deploymentId, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${relativePath}`);
  }

  const stats = fs.statSync(absolutePath);
  if (!stats.isFile()) {
    throw new Error(`Path is not a file: ${relativePath}`);
  }

  if (isBinaryFile(absolutePath)) {
    return {
      isBinary: true,
      size: stats.size,
      path: relativePath
    };
  }

  const content = fs.readFileSync(absolutePath, 'utf8');
  return {
    isBinary: false,
    content,
    size: stats.size,
    path: relativePath
  };
}

/**
 * Writes text content to a file.
 */
function saveFileContent(deploymentId, relativePath, content) {
  const { absolutePath } = ensureSafePath(deploymentId, relativePath);
  
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(absolutePath, content || '', 'utf8');
  
  const stats = fs.statSync(absolutePath);
  return {
    success: true,
    path: relativePath,
    size: stats.size,
    updatedAt: stats.mtime
  };
}

/**
 * Creates an empty file or folder.
 */
function createFileOrFolder(deploymentId, relativePath, isFolder) {
  const { absolutePath } = ensureSafePath(deploymentId, relativePath);

  if (fs.existsSync(absolutePath)) {
    throw new Error(`Path already exists: ${relativePath}`);
  }

  if (isFolder) {
    fs.mkdirSync(absolutePath, { recursive: true });
  } else {
    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absolutePath, '', 'utf8');
  }

  return {
    success: true,
    path: relativePath,
    isFolder
  };
}

/**
 * Deletes a file or folder recursively.
 */
function deleteFileOrFolder(deploymentId, relativePath) {
  const { absolutePath } = ensureSafePath(deploymentId, relativePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Path does not exist: ${relativePath}`);
  }

  fs.rmSync(absolutePath, { recursive: true, force: true });

  return {
    success: true,
    path: relativePath
  };
}

/**
 * Renames a file or folder.
 */
function renameFileOrFolder(deploymentId, oldRelativePath, newRelativePath) {
  const { absolutePath: oldAbsolutePath } = ensureSafePath(deploymentId, oldRelativePath);
  const { absolutePath: newAbsolutePath } = ensureSafePath(deploymentId, newRelativePath);

  if (!fs.existsSync(oldAbsolutePath)) {
    throw new Error(`Source path does not exist: ${oldRelativePath}`);
  }

  if (fs.existsSync(newAbsolutePath)) {
    throw new Error(`Destination path already exists: ${newRelativePath}`);
  }

  const dir = path.dirname(newAbsolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.renameSync(oldAbsolutePath, newAbsolutePath);

  return {
    success: true,
    oldPath: oldRelativePath,
    newPath: newRelativePath
  };
}

module.exports = {
  getFileTree,
  getFileContent,
  saveFileContent,
  createFileOrFolder,
  deleteFileOrFolder,
  renameFileOrFolder,
  ensureSafePath
};
