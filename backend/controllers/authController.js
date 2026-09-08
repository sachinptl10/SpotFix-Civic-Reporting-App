const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// Helper to generate JWT with identity and role
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET || 'spotfix_super_secret_jwt_key_2024_secure_change_in_production',
    {
      expiresIn: '30d',
    }
  );
};

// @desc    Register a new citizen user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new AppError('An account with this email address already exists.', 409, {
      email: 'Email is already registered.',
    });
  }

  // Always create with 'citizen' role for public self-registration (security rule)
  const user = await User.create({
    name,
    email,
    password,
    role: 'citizen',
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'Account registered successfully.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password. Please check your credentials.', 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password. Please check your credentials.', 401);
  }

  if (!user.isActive) {
    throw new AppError('Your account has been deactivated. Please contact municipal support.', 403);
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'citizen',
      createdAt: user.createdAt,
    },
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile or /api/auth/me
// @access  Private
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new AppError('User profile not found.', 404);
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'citizen',
      pushToken: user.pushToken,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, pushToken } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  if (name && typeof name === 'string' && name.trim().length >= 2) {
    user.name = name.trim();
  }

  if (pushToken !== undefined) {
    user.pushToken = pushToken ? pushToken.trim() : null;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      pushToken: user.pushToken,
      createdAt: user.createdAt,
    },
  });
});

// @desc    Change user password securely
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new AppError('Please provide both current password and new password.', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long.', 422);
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new AppError('User not found.', 404);
  }

  const isCurrentMatch = await user.matchPassword(currentPassword);
  if (!isCurrentMatch) {
    throw new AppError('Current password is incorrect.', 400);
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please use your new password on next login.',
  });
});

// @desc    Register or update mobile push notification token
// @route   POST /api/auth/push-token
// @access  Private
const updatePushToken = asyncHandler(async (req, res) => {
  const { pushToken } = req.body;

  if (!pushToken || typeof pushToken !== 'string') {
    throw new AppError('A valid pushToken string is required.', 422);
  }

  await User.findByIdAndUpdate(req.user._id, { pushToken: pushToken.trim() });

  res.status(200).json({
    success: true,
    message: 'Push notification token registered successfully.',
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updatePushToken,
};
