const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');

/**
 * Configure Helmet with secure defaults while allowing mobile static image rendering
 */
const configureHelmet = () => {
  return helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allows mobile app to display /uploads images
    contentSecurityPolicy: false, // Mobile API backend does not render HTML pages
  });
};

/**
 * General API rate limiter to protect against spam / DoS
 * 300 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please try again in 15 minutes.',
    retryAfterMinutes: 15,
  },
});

/**
 * Stricter rate limiter for authentication routes
 * 20 attempts per 15 minutes to mitigate brute-force credential stuffing
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    retryAfterMinutes: 15,
  },
});

/**
 * Sanitize request bodies and query parameters against MongoDB Operator Injection
 * Replaces dangerous operators like $gt, $where with safe characters
 */
const configureMongoSanitize = () => {
  return mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`[Security Alert] Sanitized prohibited key "${key}" from ${req.ip}`);
    },
  });
};

/**
 * Hardened CORS middleware with origin checking
 */
const configureCors = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : ['*'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS security policy`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
};

module.exports = {
  configureHelmet,
  apiLimiter,
  authLimiter,
  configureMongoSanitize,
  configureCors,
};
