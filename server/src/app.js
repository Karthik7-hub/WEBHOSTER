const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const config = require('./config/config');
const deploymentRoutes = require('./routes/deploymentRoutes');
const { serveDeployedSite } = require('./middleware/staticServing');
const connectDB = require('./config/database');

const app = express();

// 1. Enable requests logging in development mode
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 2. Setup CORS policy
app.use(
  cors({
    origin: [config.frontendUrl, 'http://localhost:5173'],
    credentials: true,
  })
);

// 3. Setup Helmet security headers (with CSP adjusted for framing & local hosting)
app.use(
  helmet({
    contentSecurityPolicy: false, // Let our custom CSP handle it for static files and frontend
    crossOriginEmbedderPolicy: false,
    frameguard: false, // Allow iframes for preview rendering
  })
);

// 4. Rate Limiting to prevent denial of service (DoS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

const deployLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 deployments per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many deployments initiated from this IP, please wait 15 minutes.',
  },
});

app.use('/api/', globalLimiter);
app.use('/api/deploy', deployLimiter);

// 5. Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for API and preview/deployment routes
app.use(['/api', '/p'], async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware failed:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({
        success: false,
        error: 'Database connection failed. Please try again later.',
      });
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.status(500).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Service Unavailable - WebHoster</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
          <style>
            body {
              background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
              color: #f8fafc;
              font-family: 'Outfit', sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              background: rgba(30, 41, 59, 0.4);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              text-align: center;
            }
            h1 {
              font-weight: 600;
              margin-top: 0;
              color: #ef4444;
            }
            p {
              color: #94a3b8;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Connection Offline</h1>
            <p>We are temporarily unable to connect to our database. Our systems are working to restore service. Please try reloading this page in a few moments.</p>
          </div>
        </body>
        </html>
      `);
    }
  }
});

// 6. Static Serving for deployed sites
app.get('/p/*', serveDeployedSite);

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

// 7. Core API Routes
app.use('/api', deploymentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// 8. Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// Serve static frontend bundle
app.use(express.static(path.join(__dirname, '../../client/dist')));

// Serve favicon.ico safely to prevent fallthrough crashes
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Fallback all SPA routes to index.html (History API fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/p/')) {
    return next();
  }
  
  const frontendIndexPath = path.join(__dirname, '../../client/dist/index.html');
  if (fs.existsSync(frontendIndexPath)) {
    return res.sendFile(frontendIndexPath);
  } else {
    // Graceful fallback for backend-only/serverless deployments without the built client folder
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WebHoster API Engine</title>
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
        <style>
          body {
            background: radial-gradient(circle at center, #0f172a 0%, #020617 100%);
            color: #f8fafc;
            font-family: 'Outfit', sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
          }
          .container {
            background: rgba(30, 41, 59, 0.4);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 40px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            text-align: center;
          }
          .logo {
            font-size: 2.5rem;
            font-weight: 800;
            background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
            letter-spacing: -1px;
          }
          .status-badge {
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            color: #10b981;
            padding: 6px 16px;
            border-radius: 9999px;
            font-size: 0.85rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 20px;
          }
          h2 {
            font-weight: 600;
            margin-top: 0;
            color: #f1f5f9;
          }
          p {
            color: #94a3b8;
            line-height: 1.6;
            margin-bottom: 30px;
          }
          .endpoints {
            text-align: left;
            background: rgba(15, 23, 42, 0.6);
            border-radius: 12px;
            padding: 20px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .endpoint-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .endpoint-item:last-child {
            border-bottom: none;
          }
          .method {
            font-family: monospace;
            font-weight: bold;
            color: #38bdf8;
          }
          .path {
            font-family: monospace;
            color: #cbd5e1;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">✦ WebHoster API</div>
          <div class="status-badge">● Engine Online</div>
          <h2>Production Server Running</h2>
          <p>The WebHoster core API engine is fully operational. The frontend client application is deployed as a separate static site.</p>
          <div class="endpoints">
            <div class="endpoint-item">
              <span class="method">GET</span>
              <span class="path">/health</span>
            </div>
            <div class="endpoint-item">
              <span class="method">GET</span>
              <span class="path">/p/:id/</span>
            </div>
            <div class="endpoint-item">
              <span class="method">POST</span>
              <span class="path">/api/auth/login</span>
            </div>
            <div class="endpoint-item">
              <span class="method">POST</span>
              <span class="path">/api/deploy</span>
            </div>
          </div>
        </div>
      </body>
      </html>
    `);
  }
});

// 9. Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Global Error Caught:', err);

  // Handle Multer limit errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'Upload Error: File size exceeds the 20MB limit.',
    });
  }

  // Handle custom validation/security errors
  if (err.message.includes('Validation') || err.message.includes('Security') || err.message.includes('Hosting')) {
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  return res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error. Please contact support.',
  });
});

module.exports = app;
