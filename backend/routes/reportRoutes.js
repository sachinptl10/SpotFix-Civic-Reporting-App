const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportStats,
} = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All report routes require authentication
router.use(protect);

router.route('/')
  .post(upload.single('image'), createReport)
  .get(getReports);

router.get('/stats', getReportStats);

router.route('/:id')
  .get(getReportById)
  .put(upload.single('image'), updateReport)
  .delete(deleteReport);

module.exports = router;
