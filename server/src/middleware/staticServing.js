const path = require('path');
const fs = require('fs');
const deploymentService = require('../services/deploymentService');
const config = require('../config/config');

/**
 * Custom static file serving middleware for deployed websites.
 * Captures `/p/:id/*` traffic, restores files lazily if missing, and resolves correct filesystem resources.
 */
async function serveDeployedSite(req, res, next) {
  // Extract parts from path (e.g. "/p/rd92yjude1/css/style.css" -> ["p", "rd92yjude1", "css", "style.css"])
  const parts = req.path.split('/').filter(Boolean);

  if (parts.length < 2 || parts[0] !== 'p') {
    return res.status(404).type('txt').send('Invalid deployment path');
  }

  const deploymentId = parts[1];
  const deployment = await deploymentService.getDeployment(deploymentId);

  // 1. If deployment does not exist, return a premium 404 page
  if (!deployment) {
    res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deployment Not Found - WebHoster</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
        <style>
          body {
            background: radial-gradient(circle at center, #1a162b 0%, #0d0a15 100%);
            color: #ffffff;
            font-family: 'Outfit', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            text-align: center;
          }
          .card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px 60px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
            max-width: 480px;
          }
          h1 {
            font-size: 3rem;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            color: rgba(255, 255, 255, 0.6);
            font-size: 1.1rem;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .btn {
            background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
            color: white;
            text-decoration: none;
            padding: 12px 28px;
            border-radius: 12px;
            font-weight: 600;
            letter-spacing: 0.5px;
            box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
            transition: all 0.3s ease;
          }
          .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>404</h1>
          <h3>Site Deployment Not Found</h3>
          <p>The project deployment ID <strong>${deploymentId}</strong> does not exist or has been deleted by the owner.</p>
          <a href="${config.frontendUrl}" class="btn">Back to Dashboard</a>
        </div>
      </body>
      </html>
    `);
    return;
  }

  // 2. Trailing Slash Check: 
  // If request path is exactly "/p/abc123" without a trailing slash, redirect to "/p/abc123/"
  const originalUrl = req.originalUrl; // e.g. "/p/abc123"
  
  if (originalUrl === `/p/${deploymentId}`) {
    return res.redirect(302, `/p/${deploymentId}/`);
  }

  // 3. Resolve file path in deployments directory
  // 3. Resolve file path in deployments directory (serve from drafts if preview mode is active)
  const isPreview = req.query.preview === 'true' || (req.headers.referer && req.headers.referer.includes('preview=true'));
  const baseDeploymentDir = isPreview
    ? path.join(config.paths.deployments, '.drafts', deploymentId)
    : path.join(config.paths.deployments, deploymentId);

  // Lazy ZIP restoration if the folder was deleted (cold cache inside ephemeral Vercel /tmp)
  if (!fs.existsSync(baseDeploymentDir)) {
    if (isPreview) {
      const liveDir = path.join(config.paths.deployments, deploymentId);
      if (fs.existsSync(liveDir)) {
        console.log(`[staticServing] Dynamically cloning live files to drafts for ${deploymentId}`);
        fs.mkdirSync(baseDeploymentDir, { recursive: true });
        const copyRecursiveSync = (src, dest) => {
          if (fs.statSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach((childItemName) => {
              copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
            });
          } else {
            fs.copyFileSync(src, dest);
          }
        };
        copyRecursiveSync(liveDir, baseDeploymentDir);
      } else {
        if (!deployment.backupUrl) {
          return res.status(404).type('txt').send('Deployment files not found.');
        }
        try {
          await deploymentService.restoreFromBackup(deploymentId, deployment.backupUrl);
          fs.mkdirSync(baseDeploymentDir, { recursive: true });
          const copyRecursiveSync = (src, dest) => {
            if (fs.statSync(src).isDirectory()) {
              if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
              fs.readdirSync(src).forEach((childItemName) => {
                copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
              });
            } else {
              fs.copyFileSync(src, dest);
            }
          };
          copyRecursiveSync(liveDir, baseDeploymentDir);
        } catch (err) {
          console.error(`[ERROR] Draft lazy restoration failed for ${deploymentId}:`, err);
          return res.status(500).type('txt').send('Error restoring files.');
        }
      }
    } else {
      if (!deployment.backupUrl) {
        console.error(`[ERROR] Unable to restore deployment ${deploymentId}: backup URL is missing.`);
        return res.status(404).type('txt').send('Deployment files not found locally and no backup exists.');
      }

      try {
        await deploymentService.restoreFromBackup(deploymentId, deployment.backupUrl);
      } catch (restoreError) {
        console.error(`[ERROR] Lazy restoration failed for ${deploymentId}:`, restoreError);
        return res.status(500).type('txt').send('Error unzipping deployment files from persistent storage.');
      }
    }
  }
  
  // Extract the relative subpath being requested by subtracting prefix "/p/:id"
  const prefix = `/p/${deploymentId}`;
  let subpath = req.path.substring(prefix.length) || '/';
  
  // Normalize subpath to prevent path traversal attempts
  subpath = path.normalize(subpath).replace(/^(\.\.(\/|\\|$))+/, '');

  // Convert all backslashes to forward slashes for unified comparison logic on Windows/Linux
  const cleanSubpath = subpath.replace(/\\/g, '/');

  let fileToServe = '';

  if (cleanSubpath === '/' || cleanSubpath === '' || cleanSubpath === '/index.html') {
    // Serve the registered main index.html file
    fileToServe = path.join(baseDeploymentDir, deployment.indexFilePath);
  } else {
    // Try to find file directly under deployments/abc123/css/style.css
    const directPath = path.join(baseDeploymentDir, subpath);
    
    // If index.html is deep nested (e.g. indexFilePath is "portfolio/index.html"),
    // check if file is located relative to the parent of indexFilePath (deployments/abc123/portfolio/css/style.css)
    const indexParentDir = path.dirname(deployment.indexFilePath);
    const nestedPath = path.join(baseDeploymentDir, indexParentDir, subpath);

    if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
      fileToServe = directPath;
    } else if (indexParentDir !== '.' && fs.existsSync(nestedPath) && fs.statSync(nestedPath).isFile()) {
      fileToServe = nestedPath;
    } else {
      // Default to directPath to let Express handle standard 404, or fallback to directPath
      fileToServe = directPath;
    }
  }

  // Double check that file actually exists and resides inside the deployment boundary
  const resolvedFileToServe = path.resolve(fileToServe);
  const resolvedBaseDeployment = path.resolve(baseDeploymentDir);

  console.log(`[DEBUG] resolvedFileToServe: "${resolvedFileToServe}"`);
  console.log(`[DEBUG] resolvedBaseDeployment: "${resolvedBaseDeployment}"`);
  console.log(`[DEBUG] fs.existsSync check: ${fs.existsSync(resolvedFileToServe)}`);

  if (!resolvedFileToServe.startsWith(resolvedBaseDeployment)) {
    return res.status(403).type('txt').send('Forbidden: Path outside sandbox boundary');
  }

  if (!fs.existsSync(resolvedFileToServe) || !fs.statSync(resolvedFileToServe).isFile()) {
    console.log(`[DEBUG] File not found or not a file: "${resolvedFileToServe}"`);
    // If the file is not found, we can return a friendly 404 for that asset with plain text MIME type
    return res.status(404).type('txt').send('Asset not found');
  }

  // Set sandboxing headers so that deployed user-code cannot hijack cookies/storage of the main panel.
  res.setHeader('Content-Security-Policy', "default-src 'self' 'unsafe-inline' 'unsafe-eval' *; img-src * data:; media-src *; connect-src *; style-src 'self' 'unsafe-inline' *;");

  // Send file with correct content type auto-detection
  res.sendFile(resolvedFileToServe);
}

module.exports = {
  serveDeployedSite,
};
