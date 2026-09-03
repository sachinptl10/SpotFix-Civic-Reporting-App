/**
 * Higher-order function to wrap asynchronous route handlers.
 * Automatically catches any rejected promises or thrown exceptions
 * and forwards them to the next() error handler, eliminating try-catch boilerplate.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
