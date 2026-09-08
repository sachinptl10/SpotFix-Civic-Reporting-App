const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updatePushToken,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { validateRegisterInput, validateLoginInput } = require('../middleware/validator');

// Public authentication routes with brute-force rate-limiting and validation
router.post('/register', authLimiter, validateRegisterInput, register);
router.post('/login', authLimiter, validateLoginInput, login);

// Protected identity & profile endpoints
router.route('/profile')
  .get(protect, getProfile)
  .put(protect, updateProfile);

router.get('/me', protect, getProfile);
router.put('/change-password', protect, changePassword);
router.post('/push-token', protect, updatePushToken);

module.exports = router;
