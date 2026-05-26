const app = require('./src/app');
const config = require('./src/config/config');
const connectDB = require('./src/config/database');

// Connect to MongoDB
connectDB().catch((err) => {
  console.error('Fatal: Failed to connect to MongoDB on startup:', err);
});

const server = app.listen(config.port, () => {
  console.log(`=========================================`);
  console.log(` WebHoster Node Server successfully loaded`);
  console.log(` Running in: [${config.env}] mode`);
  console.log(` Listening on: http://localhost:${config.port}`);
  console.log(` Deployments storage: ${config.paths.deployments}`);
  console.log(` Temporary uploads: ${config.paths.uploads}`);
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
