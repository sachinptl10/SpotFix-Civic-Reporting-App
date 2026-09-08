const express = require('express');
const router = express.Router();
const {
  createReport,
  getNearbyReports,
  getMyReports,
  getReports,
  getReportById,
  markUnderReview,
  approveReport,
  rejectReport,
  setPriority,
  resolveReport,
  updateReport,
  deleteReport,
  batchUpdateStatus,
  getReportStats,
  exportReportPdf,
} = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { cacheResponse } = require('../middleware/cache');
const {
  validateReportInput,
  validateNearbyInput,
  sanitizePagination,
} = require('../middleware/validator');

// All report operations require authentication
router.use(protect);

// Geospatial issue discovery near coordinates
router.get('/nearby', validateNearbyInput, getNearbyReports);

// Citizen queue & statistics (cached for 15s)
router.get('/mine', sanitizePagination, getMyReports);
router.get('/stats', cacheResponse(15, ['reports']), getReportStats);

// Batch triage operations (Government only)
router.post('/batch-status', requireRole('government'), batchUpdateStatus);

// Main report creation & triage queue
router.route('/')
  .post(upload.single('image'), validateReportInput, createReport)
  .get(sanitizePagination, getReports);

// Government workflow actions (Strictly require government role)
router.patch('/:id/review', requireRole('government'), markUnderReview);
router.patch('/:id/approve', requireRole('government'), approveReport);
router.patch('/:id/reject', requireRole('government'), rejectReport);
router.patch('/:id/priority', requireRole('government'), setPriority);
router.patch(
  '/:id/resolve',
  requireRole('government'),
  upload.single('resolvedImage'),
  resolveReport
);

// Individual report operations
router.get('/:id/export-pdf', exportReportPdf);

router.route('/:id')
  .get(getReportById)
  .put(upload.single('image'), updateReport)
  .delete(deleteReport);

module.exports = router;
