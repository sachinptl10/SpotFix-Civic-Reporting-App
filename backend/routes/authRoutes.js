const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validator');

// Public authentication routes with brute-force rate-limiting and validation
router.post('/register', authLimiter, validateRegisterInput, register);
router.post('/login', authLimiter, validateLoginInput, login);

// Protected identity endpoints
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);

module.exports = router;
