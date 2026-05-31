const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/config');
const deploymentRoutes = require('./routes/deploymentRoutes');
const { serveDeployedSite } = require('./middleware/staticServing');

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

// Fallback all SPA routes to index.html (History API fallback)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/p/')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
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
