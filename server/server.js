const path = require('path');
const app = require('./src/app');
const config = require('./src/config/config');
const connectDB = require('./src/config/database');

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('Fatal: Failed to connect to MongoDB on startup:', err);
});

const server = app.listen(config.port, () => {
  const relDeployments = path.relative(path.resolve(__dirname, '..'), config.paths.deployments).replace(/\\/g, '/');
  const relUploads = path.relative(path.resolve(__dirname, '..'), config.paths.uploads).replace(/\\/g, '/');
  
  console.log(`=========================================`);
  console.log(` WebHoster Node Server successfully loaded`);
  console.log(` Running in: [${config.env}] mode`);
  console.log(` Listening on: http://localhost:${config.port}`);
  console.log(` Deployments storage: ./${relDeployments}`);
  console.log(` Temporary uploads: ./${relUploads}`);
  console.log(`=========================================`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
