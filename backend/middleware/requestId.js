const crypto = require('crypto');

/**
 * Middleware to ensure every HTTP request has a unique correlation ID (X-Request-Id).
 * Propagates existing X-Request-Id header if supplied by a proxy or client,
 * otherwise generates a cryptographically secure UUIDv4.
 */
const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId =
    typeof incomingId === 'string' && incomingId.trim().length > 0
      ? incomingId.trim()
      : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};

module.exports = requestIdMiddleware;
