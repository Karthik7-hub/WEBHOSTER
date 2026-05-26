const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Define core directory paths relative to project root (use /tmp on Vercel for write access)
const ROOT_DIR = process.env.VERCEL ? '/tmp' : path.resolve(__dirname, '../../..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DEPLOYMENTS_DIR = path.join(ROOT_DIR, 'deployments');
const TEMP_DIR = path.join(ROOT_DIR, 'temp');

// Ensure necessary directories exist
[UPLOADS_DIR, DEPLOYMENTS_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn(`Warning: Could not create directory ${dir}. This is expected in read-only environments like Vercel.`);
    }
  }
});

module.exports = {
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  imageKit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  },
  paths: {
    root: ROOT_DIR,
    uploads: UPLOADS_DIR,
    deployments: DEPLOYMENTS_DIR,
    temp: TEMP_DIR,
  },
};
