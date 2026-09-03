const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const morgan = require('morgan');
const connectDB = require('./config/db');
const { checkDbHealth, disconnectDB } = require('./config/db');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');
const {
  configureHelmet,
  configureCors,
  configureMongoSanitize,
  apiLimiter,
} = require('./middleware/security');

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Trust reverse proxy if running behind Nginx / Heroku / AWS ALB
app.set('trust proxy', 1);

// 1. HTTP Security Headers
app.use(configureHelmet());

// 2. CORS policy enforcement
app.use(configureCors());

// 3. HTTP Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
      skip: (req) => req.originalUrl === '/api/health', // Don't clutter logs with health checks
    })
  );
}

// 4. Body parser with strict limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Data Sanitization against NoSQL Query Injection
app.use(configureMongoSanitize());

// 6. Serve static uploads securely with cache control
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d',
    etag: true,
  })
);

// 7. General API Rate Limiter
app.use('/api', apiLimiter);

// Health check & diagnostic endpoints
app.get('/api/health', async (req, res) => {
  const dbHealth = await checkDbHealth();
  const isHealthy = dbHealth.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'online' : 'degraded',
    version: '2.0.0',
    service: 'SpotFix Civic Management Engine',
    uptimeSeconds: Math.floor(process.uptime()),
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health/diagnostics', async (req, res) => {
  const dbHealth = await checkDbHealth();
  const mem = process.memoryUsage();

  res.status(200).json({
    status: 'online',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    memory: {
      rssMb: (mem.rss / 1024 / 1024).toFixed(2),
      heapTotalMb: (mem.heapTotal / 1024 / 1024).toFixed(2),
      heapUsedMb: (mem.heapUsed / 1024 / 1024).toFixed(2),
    },
    database: dbHealth,
    timestamp: new Date().toISOString(),
  });
});

// Mount route handlers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 'fail',
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Centralized error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`[SpotFix API V2] Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  logger.info(`[SpotFix API V2] Health endpoint: http://localhost:${PORT}/api/health`);
  logger.info(`[SpotFix API V2] Diagnostics endpoint: http://localhost:${PORT}/api/health/diagnostics`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`[Unhandled Rejection] ${err.message}`);
});

// Graceful shutdown handling
const handleGracefulShutdown = (signal) => {
  logger.info(`[Shutdown] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('[Shutdown] HTTP server closed.');
    await disconnectDB();
    logger.info('[Shutdown] Clean shutdown completed. Exiting.');
    process.exit(0);
  });

  // Force close if graceful shutdown exceeds 10 seconds
  setTimeout(() => {
    logger.error('[Shutdown] Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

module.exports = app;
