const express = require('express');
const router = express.Router();
const {
  createReport,
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
  getReportStats,
} = require('../controllers/reportController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All report routes require authentication
router.use(protect);

// Citizen queue & statistics
router.get('/mine', getMyReports);
router.get('/stats', getReportStats);

// Main report submission & triage queue
router.route('/')
  .post(upload.single('image'), createReport)
  .get(getReports);

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
router.route('/:id')
  .get(getReportById)
  .put(upload.single('image'), updateReport)
  .delete(deleteReport);

module.exports = router;
