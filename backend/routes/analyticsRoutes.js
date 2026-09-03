const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, requireRole } = require('../middleware/auth');

// All analytics routes require government role
router.use(protect);
router.use(requireRole('government'));

router.get('/summary', getAnalyticsSummary);

module.exports = router;
