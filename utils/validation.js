/**
 * SpotFix Input Validation Utilities
 */

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return 'Email address is required.';
  }
  const cleanEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return 'Please enter a valid email address.';
  }
  return null;
};

export const validatePassword = (password, minLength = 6) => {
  if (!password) {
    return 'Password is required.';
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters long.`;
  }
  return null;
};

export const validateRegistration = ({ name, email, password, confirmPassword }) => {
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Full name is required.';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLogin = ({ email, password }) => {
  const errors = {};

  const emailError = validateEmail(email);
  if (emailError) {
    errors.email = emailError;
  }

  if (!password) {
    errors.password = 'Password is required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateReportForm = ({ title, category, description, imageUri, location }) => {
  const errors = {};

  if (!title || title.trim().length === 0) {
    errors.title = 'Issue title is required.';
  } else if (title.trim().length < 5) {
    errors.title = 'Title must be at least 5 characters.';
  }

  if (!category) {
    errors.category = 'Please select a problem category.';
  }

  if (!description || description.trim().length === 0) {
    errors.description = 'Please provide a description of the issue.';
  } else if (description.trim().length < 10) {
    errors.description = 'Description must be at least 10 characters.';
  }

  if (!imageUri) {
    errors.image = 'An issue photograph is required.';
  }

  if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
    errors.location = 'Valid GPS location coordinates are required.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
