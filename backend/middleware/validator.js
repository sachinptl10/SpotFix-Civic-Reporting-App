const AppError = require('../utils/AppError');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_CATEGORIES = [
  'roads',
  'sanitation',
  'electricity',
  'water',
  'drainage',
  'public-property',
  'other',
  // Backward compatibility
  'Pothole',
  'Garbage',
  'Broken Streetlight',
  'Damaged Road',
  'Water Leakage',
  'Drainage Problem',
  'Public Property Damage',
  'Other',
];

/**
 * Validates citizen registration payload
 */
const validateRegisterInput = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (name.trim().length > 60) {
    errors.name = 'Name cannot exceed 60 characters.';
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long.';
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Registration validation failed.', 422, errors));
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates user login payload
 */
const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Invalid credentials format.', 422, errors));
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates report creation input
 */
const validateReportInput = (req, res, next) => {
  const { title, description, category, latitude, longitude, address } = req.body;
  const errors = {};

  if (!title || title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  } else if (title.trim().length > 120) {
    errors.title = 'Title cannot exceed 120 characters.';
  }

  if (!description || description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  } else if (description.trim().length > 2000) {
    errors.description = 'Description cannot exceed 2000 characters.';
  }

  if (!category || !VALID_CATEGORIES.includes(category.trim())) {
    errors.category = 'Please select a valid civic issue category.';
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  if (isNaN(lat) || lat < -90 || lat > 90) {
    errors.latitude = 'A valid latitude between -90 and 90 is required.';
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    errors.longitude = 'A valid longitude between -180 and 180 is required.';
  }

  if (Object.keys(errors).length > 0) {
    return next(new AppError('Report validation failed.', 422, errors));
  }

  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.category = category.trim();
  req.body.latitude = lat;
  req.body.longitude = lng;
  req.body.address = address ? address.trim() : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  next();
};

/**
 * Validates geospatial query parameters for /api/reports/nearby
 */
const validateNearbyInput = (req, res, next) => {
  const lat = parseFloat(req.query.latitude || req.query.lat);
  const lng = parseFloat(req.query.longitude || req.query.lng);
  const radius = parseFloat(req.query.radius || req.query.distance) || 5000; // default 5km in meters

  if (isNaN(lat) || lat < -90 || lat > 90) {
    return next(new AppError('Query parameter "latitude" must be a float between -90 and 90.', 422));
  }
  if (isNaN(lng) || lng < -180 || lng > 180) {
    return next(new AppError('Query parameter "longitude" must be a float between -180 and 180.', 422));
  }
  if (radius <= 0 || radius > 100000) {
    return next(new AppError('Query parameter "radius" must be between 1 and 100,000 meters (100km).', 422));
  }

  req.nearbyCoords = { latitude: lat, longitude: lng, radiusMeters: radius };
  next();
};

/**
 * Sanitizes pagination and filter parameters to prevent Denial of Service
 */
const sanitizePagination = (req, res, next) => {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 50) limit = 50; // Cap to max 50 items per page to prevent memory abuse

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
  };
  next();
};

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateReportInput,
  validateNearbyInput,
  sanitizePagination,
};
