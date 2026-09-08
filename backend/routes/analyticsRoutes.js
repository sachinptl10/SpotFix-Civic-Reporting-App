const express = require('express');
const router = express.Router();
const { getAnalyticsSummary } = require('../controllers/analyticsController');
const { protect, requireRole } = require('../middleware/auth');
const { cacheResponse } = require('../middleware/cache');

// All analytics routes require government role
router.use(protect);
router.use(requireRole('government'));

// Cached for 20 seconds with auto-invalidation on report changes
router.get('/summary', cacheResponse(20, ['analytics', 'reports']), getAnalyticsSummary);

module.exports = router;
