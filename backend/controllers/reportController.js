const path = require('path');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { safeDeleteUploadFile } = require('../utils/fileUtil');
const {
  generateReportNumber,
  transitionReportStatus,
} = require('../services/reportWorkflowService');

// @desc    Create a new civic issue report
// @route   POST /api/reports
// @access  Private (Citizen)
const createReport = asyncHandler(async (req, res, next) => {
  const { title, description, category, latitude, longitude, address } = req.body;

  let imageUrl = '';
  let mediaType = 'image';

  if (req.file) {
    imageUrl = `/uploads/${req.file.filename}`;
    if (req.file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    }
  }

  // Generate unique human-readable report identifier (#SP-XXXXX)
  const reportNumber = await generateReportNumber();

  let report;
  try {
    report = await Report.create({
      reportNumber,
      user: req.user._id,
      title,
      description,
      category,
      latitude,
      longitude,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // [lng, lat]
      },
      address,
      imageUrl,
      mediaType,
      status: 'pending',
      priority: 'medium',
      statusHistory: [
        {
          status: 'pending',
          note: 'Report submitted by citizen',
          changedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
    });
  } catch (createErr) {
    if (req.file) {
      await safeDeleteUploadFile(req.file.filename);
    }
    throw createErr;
  }

  // Dispatch initial citizen confirmation notification
  try {
    await Notification.create({
      userId: req.user._id,
      reportId: report._id,
      type: 'report_submitted',
      message: `Your report #${report.reportNumber} ("${report.title}") has been submitted and is pending municipal review.`,
      isRead: false,
    });
  } catch (notifErr) {
    console.warn('[Report] Non-critical notification error:', notifErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Civic issue report created successfully.',
    report,
  });
});

// @desc    Get reports near a geographic coordinate
// @route   GET /api/reports/nearby
// @access  Private
const getNearbyReports = asyncHandler(async (req, res) => {
  const { latitude, longitude, radiusMeters } = req.nearbyCoords;

  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusMeters,
      },
    },
  };

  if (req.query.status && req.query.status !== 'All') {
    query.status = req.query.status;
  }

  if (req.query.category && req.query.category !== 'All') {
    query.category = req.query.category;
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  const reports = await Report.find(query)
    .populate('user', 'name email')
    .populate('reviewedBy', 'name email')
    .limit(limit);

  res.status(200).json({
    success: true,
    count: reports.length,
    coordinates: { latitude, longitude },
    radiusMeters,
    reports,
  });
});

// @desc    Get reports for authenticated citizen
// @route   GET /api/reports/mine
// @access  Private (Citizen)
const getMyReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
  const query = { user: req.user._id };

  if (req.query.status && req.query.status !== 'All') {
    query.status = req.query.status;
  }

  if (req.query.category && req.query.category !== 'All') {
    query.category = req.query.category;
  }

  if (req.query.q) {
    const safeQ = req.query.q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(safeQ, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { address: searchRegex },
      { reportNumber: searchRegex },
    ];
  }

  const [reports, total] = await Promise.all([
    Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Report.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit) || 1;

  res.status(200).json({
    success: true,
    reports,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore: page < pages,
    },
    total,
    page,
    pages,
    hasMore: page < pages,
  });
});

// @desc    Get reports with filters and pagination (Government Queue or General Feed)
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = req.pagination || { page: 1, limit: 10, skip: 0 };
  const query = {};

  // If citizen, scope to their own reports unless explicitly requesting all public markers
  if (req.user.role === 'citizen' && req.query.scope !== 'all') {
    query.user = req.user._id;
  }

  if (req.query.status && req.query.status !== 'All') {
    query.status = req.query.status;
  }

  if (req.query.category && req.query.category !== 'All') {
    query.category = req.query.category;
  }

  if (req.query.priority && req.query.priority !== 'All') {
    query.priority = req.query.priority;
  }

  const searchParam = req.query.search || req.query.q;
  if (searchParam && searchParam.trim().length > 0) {
    const safeTerm = searchParam.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(safeTerm, 'i');
    query.$or = [
      { title: searchRegex },
      { description: searchRegex },
      { address: searchRegex },
      { reportNumber: searchRegex },
    ];
  }

  let sort = { createdAt: -1 };
  if (req.query.sort === 'oldest') {
    sort = { createdAt: 1 };
  } else if (req.query.sort === 'priority') {
    sort = { priority: -1, createdAt: -1 };
  }

  const [reports, total] = await Promise.all([
    Report.find(query)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Report.countDocuments(query),
  ]);

  const pages = Math.ceil(total / limit) || 1;

  res.status(200).json({
    success: true,
    reports,
    pagination: {
      page,
      limit,
      total,
      pages,
      hasMore: page < pages,
    },
    total,
    page,
    pages,
    hasMore: page < pages,
  });
});

// @desc    Get single report details
// @route   GET /api/reports/:id
// @access  Private
const getReportById = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id)
    .populate('user', 'name email')
    .populate('reviewedBy', 'name email')
    .populate('statusHistory.changedBy', 'name email role');

  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  // Ownership security: Citizens can only view their own reports
  if (req.user.role === 'citizen' && !report.user._id.equals(req.user._id)) {
    throw new AppError('Access denied. You do not have permission to view this report.', 403);
  }

  res.status(200).json({
    success: true,
    report,
  });
});

// @desc    Mark report Under Review
// @route   PATCH /api/reports/:id/review
// @access  Private (Government only)
const markUnderReview = asyncHandler(async (req, res) => {
  const { note } = req.body || {};
  const report = await transitionReportStatus({
    reportId: req.params.id,
    targetStatus: 'under_review',
    user: req.user,
    note: note || 'Issue taken under review by municipal authorities.',
  });

  res.status(200).json({
    success: true,
    message: 'Report status updated to Under Review.',
    report,
  });
});

// @desc    Approve report for action
// @route   PATCH /api/reports/:id/approve
// @access  Private (Government only)
const approveReport = asyncHandler(async (req, res) => {
  const { reviewNote } = req.body || {};
  const note = (reviewNote || '').trim() || 'Report verified and approved for civic resolution.';

  const report = await transitionReportStatus({
    reportId: req.params.id,
    targetStatus: 'approved',
    user: req.user,
    note,
  });

  res.status(200).json({
    success: true,
    message: 'Report has been approved.',
    report,
  });
});

// @desc    Reject report with mandatory reason
// @route   PATCH /api/reports/:id/reject
// @access  Private (Government only)
const rejectReport = asyncHandler(async (req, res) => {
  const { reviewNote } = req.body || {};

  if (!reviewNote || reviewNote.trim().length === 0) {
    throw new AppError('A rejection reason is mandatory.', 422, {
      reviewNote: 'Please provide a reason why this report is rejected.',
    });
  }

  if (reviewNote.trim().length < 5) {
    throw new AppError('Rejection reason must be at least 5 characters.', 422, {
      reviewNote: 'Rejection reason must be at least 5 characters.',
    });
  }

  const report = await transitionReportStatus({
    reportId: req.params.id,
    targetStatus: 'rejected',
    user: req.user,
    note: reviewNote.trim(),
  });

  res.status(200).json({
    success: true,
    message: 'Report has been rejected.',
    report,
  });
});

// @desc    Set report priority (Low, Medium, High)
// @route   PATCH /api/reports/:id/priority
// @access  Private (Government only)
const setPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  const allowed = ['low', 'medium', 'high'];

  if (!priority || !allowed.includes(priority.toLowerCase())) {
    throw new AppError('Invalid priority. Allowed values: low, medium, high.', 422);
  }

  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  report.priority = priority.toLowerCase();
  await report.save();

  res.status(200).json({
    success: true,
    message: `Priority updated to ${priority.toLowerCase()}.`,
    report,
  });
});

// @desc    Resolve report with resolution photo and note
// @route   PATCH /api/reports/:id/resolve
// @access  Private (Government only)
const resolveReport = asyncHandler(async (req, res) => {
  const { note, resolutionNote } = req.body;
  const finalNote = (note || resolutionNote || '').trim();

  if (!finalNote || finalNote.length === 0) {
    if (req.file) await safeDeleteUploadFile(req.file.filename);
    throw new AppError('Resolution note is required.', 422, {
      note: 'Please provide details on how the issue was resolved.',
    });
  }

  if (!req.file) {
    throw new AppError('Resolution proof photograph is required.', 422, {
      resolvedImage: 'Please upload a photo proving the issue has been resolved.',
    });
  }

  const resolvedImageUrl = `/uploads/${req.file.filename}`;

  const report = await transitionReportStatus({
    reportId: req.params.id,
    targetStatus: 'resolved',
    user: req.user,
    note: finalNote,
    extraFields: { resolvedImageUrl },
  });

  res.status(200).json({
    success: true,
    message: 'Report marked as Resolved with proof.',
    report,
  });
});

// @desc    Update report details (Citizen)
// @route   PUT /api/reports/:id
// @access  Private (Report owner)
const updateReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  if (!report.user.equals(req.user._id) && req.user.role !== 'government') {
    throw new AppError('Access denied. You cannot edit this report.', 403);
  }

  if (report.status !== 'pending' && req.user.role !== 'government') {
    throw new AppError(`Cannot edit report because it is already '${report.status}'.`, 409);
  }

  const { title, description, category } = req.body;
  if (title && title.trim().length >= 5) report.title = title.trim();
  if (description && description.trim().length >= 10) report.description = description.trim();
  if (category) report.category = category.trim();

  if (req.file) {
    // Delete old image if it exists
    if (report.imageUrl) {
      await safeDeleteUploadFile(path.basename(report.imageUrl));
    }
    report.imageUrl = `/uploads/${req.file.filename}`;
    report.mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  }

  await report.save();

  res.status(200).json({
    success: true,
    message: 'Report updated successfully.',
    report,
  });
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Owner or Government)
const deleteReport = asyncHandler(async (req, res) => {
  const report = await Report.findById(req.params.id);
  if (!report) {
    throw new AppError('Report not found.', 404);
  }

  if (!report.user.equals(req.user._id) && req.user.role !== 'government') {
    throw new AppError('Access denied. You cannot delete this report.', 403);
  }

  // Delete attached files safely
  if (report.imageUrl) {
    await safeDeleteUploadFile(path.basename(report.imageUrl));
  }
  if (report.resolvedImageUrl) {
    await safeDeleteUploadFile(path.basename(report.resolvedImageUrl));
  }

  // Delete associated notifications
  await Notification.deleteMany({ reportId: report._id });
  await report.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Report and associated records deleted successfully.',
  });
});

// @desc    Get report stats for dashboard
// @route   GET /api/reports/stats
// @access  Private
const getReportStats = asyncHandler(async (req, res) => {
  const query = req.user.role === 'citizen' ? { user: req.user._id } : {};

  const [total, resolved, pending, underReview, approved, rejected] = await Promise.all([
    Report.countDocuments(query),
    Report.countDocuments({ ...query, status: 'resolved' }),
    Report.countDocuments({ ...query, status: 'pending' }),
    Report.countDocuments({ ...query, status: 'under_review' }),
    Report.countDocuments({ ...query, status: 'approved' }),
    Report.countDocuments({ ...query, status: 'rejected' }),
  ]);

  res.status(200).json({
    success: true,
    stats: {
      total,
      resolved,
      pending: pending + underReview,
      inProgress: underReview + approved,
      approved,
      rejected,
    },
  });
});

module.exports = {
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
  getReportStats,
};
