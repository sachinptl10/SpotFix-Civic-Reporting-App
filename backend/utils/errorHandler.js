const logger = require('./logger');

/**
 * Centralized, production-grade error handling middleware.
 * Formats errors consistently, maps status codes, and prevents
 * sensitive stack traces from leaking to clients in production.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Internal Server Error. Please try again later.';
  let errors = err.errors || undefined;

  // Log error with context
  logger.error(`[${req.method} ${req.originalUrl}] ${err.name || 'Error'}: ${err.message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    logger.debug(err.stack);
  }

  // Mongoose bad ObjectId format
  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found with identifier "${err.value}".`;
  }

  // Mongoose duplicate key constraint
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'identifier';
    message = `A resource with that ${field} already exists.`;
  }

  // Mongoose Schema Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 422;
    errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    message = Object.values(errors).join(', ');
  }

  // JWT Token validation errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // Multer File Upload Errors
  if (err.name === 'MulterError') {
    statusCode = 422;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'File size exceeds maximum allowed limit of 30MB.';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'Too many files uploaded in a single request.';
    } else {
      message = `File upload error: ${err.message}`;
    }
  }

  // Send sanitized response
  res.status(statusCode).json({
    success: false,
    status: `${statusCode}`.startsWith('4') ? 'fail' : 'error',
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

module.exports = errorHandler;
