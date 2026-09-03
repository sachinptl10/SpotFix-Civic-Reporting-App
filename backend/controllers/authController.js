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
      createdAt: user.createdAt,
    },
  });
});

module.exports = {
  register,
  login,
  getProfile,
};
