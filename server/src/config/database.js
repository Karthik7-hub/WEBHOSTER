const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  if (isConnected) {
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is missing in the environment configuration.');
  }

  try {
    const db = await mongoose.connect(uri);
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB Connected successfully to cluster');
  } catch (error) {
    console.error('MongoDB database connection failure:', error);
    throw error;
  }
}

module.exports = connectDB;
