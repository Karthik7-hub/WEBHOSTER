const fs = require('fs');
const path = require('path');
const fileService = require('./fileService');

/**
 * Traverses a directory recursively and builds a flat index of files.
 */
function buildIndex(deploymentId) {
  const { baseDir } = fileService.ensureSafePath(deploymentId);
  
  if (!fs.existsSync(baseDir)) {
    return [];
  }

  const fileList = [];

  function traverse(dir) {
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
      if (item.name.startsWith('.') || item.name === 'node_modules') {
        continue;
      }

      const absolutePath = path.join(dir, item.name);
      const relativePath = path.relative(baseDir, absolutePath).replace(/\\/g, '/');

      if (item.isDirectory()) {
        traverse(absolutePath);
      } else {
        const ext = path.extname(item.name).toLowerCase();
        const stats = fs.statSync(absolutePath);
        
        fileList.push({
          name: item.name,
          path: relativePath,
          absolutePath,
          extension: ext,
          size: stats.size,
          updatedAt: stats.mtime
        });
      }
    }
  }

  traverse(baseDir);
  return fileList;
}

/**
 * Searches for files by name, extension, or inside text contents.
 * Returns a list of search matches.
 */
function searchProjectFiles(deploymentId, query) {
  if (!query) {
    return buildIndex(deploymentId).map(f => ({
      name: f.name,
      path: f.path,
      size: f.size
    }));
  }

  const files = buildIndex(deploymentId);
  const lowercaseQuery = query.toLowerCase();
  const results = [];

  for (const file of files) {
    let matchType = null;
    let snippets = [];

    // 1. Check path/filename match
    if (file.path.toLowerCase().includes(lowercaseQuery)) {
      matchType = 'path';
    }

    // 2. Check file content match (only for non-binary files and small files < 1MB)
    const isBinary = [
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', 
      '.woff', '.woff2', '.ttf', '.otf', '.eot', 
      '.zip', '.pdf', '.mp3', '.mp4'
    ].includes(file.extension);

    if (!isBinary && file.size < 1024 * 1024) {
      try {
        const content = fs.readFileSync(file.absolutePath, 'utf8');
        
        if (content.toLowerCase().includes(lowercaseQuery)) {
          matchType = matchType ? 'path_and_content' : 'content';
          
          // Generate brief preview snippets of matches
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            if (line.toLowerCase().includes(lowercaseQuery)) {
              // Extract snippet
              const trimmed = line.trim();
              snippets.push({
                lineNumber: idx + 1,
                text: trimmed.length > 80 ? trimmed.substring(0, 80) + '...' : trimmed
              });
            }
          });
        }
      } catch (err) {
        console.warn(`Could not index file content for ${file.path}:`, err);
      }
    }

    if (matchType) {
      results.push({
        name: file.name,
        path: file.path,
        size: file.size,
        matchType,
        snippets: snippets.slice(0, 5) // Limit to top 5 snippets
      });
    }
  }

  return results;
}

module.exports = {
  buildIndex,
  searchProjectFiles
};
