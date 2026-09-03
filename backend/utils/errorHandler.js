// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.name || 'Error'}: ${err.message}`);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id ${err.value}`;
    return res.status(404).json({
      success: false,
      message,
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'An account with that email address or identifier already exists.';
    return res.status(409).json({
      success: false,
      message,
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    return res.status(422).json({
      success: false,
      message,
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(422).json({
        success: false,
        message: 'File size exceeds allowed limit (30MB).',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error. Please try again later.',
    errors: err.errors || undefined,
  });
};

module.exports = errorHandler;
