const mongoose = require('mongoose');

let cachedConnection = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    await cachedConnection;
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in the environment configuration.');
  }

  try {
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    await cachedConnection;
    console.log('MongoDB Connected successfully to cluster');
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB database connection failure:', error);
    cachedConnection = null;
    throw error;
  }
}

module.exports = connectDB;
