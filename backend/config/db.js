const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/spotfix';

  // Event listeners for connection monitoring
  mongoose.connection.on('connected', () => {
    logger.info(`[MongoDB] Connection established to ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
  });

  mongoose.connection.on('error', (err) => {
    logger.error(`[MongoDB] Connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('[MongoDB] Connection lost. Attempting auto-reconnect...');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('[MongoDB] Reconnected successfully.');
  });

  try {
    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4 to avoid IPv6 resolution timeouts on Windows/Node
    });

    return conn;
  } catch (error) {
    logger.error(`[MongoDB] Initial connection failure: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

/**
 * Health check diagnostic to verify database ping latency.
 */
const checkDbHealth = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return {
        status: 'disconnected',
        readyState: mongoose.connection.readyState,
        latencyMs: null,
      };
    }

    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    const latencyMs = Date.now() - start;

    return {
      status: 'connected',
      readyState: 1,
      latencyMs,
      host: mongoose.connection.host,
      database: mongoose.connection.name,
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      latencyMs: null,
    };
  }
};

/**
 * Cleanly disconnect from MongoDB during graceful shutdown.
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close(false);
    logger.info('[MongoDB] Connection closed gracefully.');
  } catch (err) {
    logger.error(`[MongoDB] Error during disconnect: ${err.message}`);
  }
};

module.exports = connectDB;
module.exports.checkDbHealth = checkDbHealth;
module.exports.disconnectDB = disconnectDB;
