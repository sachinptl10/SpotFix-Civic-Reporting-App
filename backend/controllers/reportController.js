const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const {
  generateReportNumber,
  transitionReportStatus,
  validateTransition,
} = require('../services/reportWorkflowService');

// @desc    Create a new civic issue report
// @route   POST /api/reports
// @access  Private (Citizen)
const createReport = async (req, res, next) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;
    const errors = {};

    // Validate Title
    if (!title || title.trim().length === 0) {
      errors.title = 'Issue title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 120) {
      errors.title = 'Title cannot exceed 120 characters.';
    }

    // Validate Description
    if (!description || description.trim().length === 0) {
      errors.description = 'Description is required.';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (description.trim().length > 2000) {
      errors.description = 'Description cannot exceed 2000 characters.';
    }

    // Validate Category
    if (!category || category.trim().length === 0) {
      errors.category = 'Please select a valid issue category.';
    }

    // Validate Coordinates
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'A valid latitude between -90 and 90 is required.';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'A valid longitude between -180 and 180 is required.';
    }

    if (Object.keys(errors).length > 0) {
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    let imageUrl = '';
    let mediaType = 'image';

    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
      if (req.file.mimetype.startsWith('video/')) {
        mediaType = 'video';
      }
    }

    // Generate human-friendly report identifier
    const reportNumber = await generateReportNumber();

    // Create report document with initial status history
    const report = await Report.create({
      reportNumber,
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      latitude: lat,
      longitude: lng,
      address: address ? address.trim() : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
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

    // Create initial citizen confirmation notification
    try {
      await Notification.create({
        userId: req.user._id,
        reportId: report._id,
        type: 'report_submitted',
        message: `Your report #${report.reportNumber} ("${report.title}") has been submitted and is pending review.`,
        isRead: false,
      });
    } catch (e) {
      console.warn('[Report] Initial notification error:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Civic issue report created successfully.',
      report,
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
};

// @desc    Get reports for authenticated citizen
// @route   GET /api/reports/mine
// @access  Private (Citizen)
const getMyReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };

    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), 'i');
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
      // Backward compatibility fields
      total,
      page,
      pages,
      hasMore: page < pages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports with filters and pagination (Government Queue or General Feed)
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // If citizen, scope to their own reports unless explicitly requesting all public map markers
    if (req.user.role === 'citizen' && req.query.scope !== 'all') {
      query.user = req.user._id;
    }

    // Status filter
    if (req.query.status && req.query.status !== 'All') {
      query.status = req.query.status;
    }

    // Category filter
    if (req.query.category && req.query.category !== 'All') {
      query.category = req.query.category;
    }

    // Priority filter (Government queue)
    if (req.query.priority && req.query.priority !== 'All') {
      query.priority = req.query.priority;
    }

    // Search query
    const searchQuery = req.query.q || req.query.search;
    if (searchQuery && searchQuery.trim().length > 0) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { reportNumber: searchRegex },
      ];
    }

    // Sort order
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
      // Backward compatibility fields
      total,
      page,
      pages,
      hasMore: page < pages,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single report details
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user', 'name email')
      .populate('reviewedBy', 'name email')
      .populate('statusHistory.changedBy', 'name email role');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Ownership check: Citizens can only view their own reports
    if (req.user.role === 'citizen' && !report.user._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this report.',
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark report Under Review
// @route   PATCH /api/reports/:id/review
// @access  Private (Government only)
const markUnderReview = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// @desc    Approve report for action
// @route   PATCH /api/reports/:id/approve
// @access  Private (Government only)
const approveReport = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

// @desc    Reject report with mandatory reason
// @route   PATCH /api/reports/:id/reject
// @access  Private (Government only)
const rejectReport = async (req, res, next) => {
  try {
    const { reviewNote } = req.body || {};

    if (!reviewNote || reviewNote.trim().length === 0) {
      return res.status(422).json({
        success: false,
        message: 'A rejection reason is mandatory.',
        errors: {
          reviewNote: 'Please provide a reason why this report is rejected.',
        },
      });
    }

    if (reviewNote.trim().length < 5) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors: {
          reviewNote: 'Rejection reason must be at least 5 characters.',
        },
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
  } catch (error) {
    next(error);
  }
};

// @desc    Set report priority (Low, Medium, High)
// @route   PATCH /api/reports/:id/priority
// @access  Private (Government only)
const setPriority = async (req, res, next) => {
  try {
    const { priority } = req.body;
    const allowed = ['low', 'medium', 'high'];

    if (!priority || !allowed.includes(priority.toLowerCase())) {
      return res.status(422).json({
        success: false,
        message: 'Invalid priority. Must be low, medium, or high.',
        errors: { priority: 'Allowed values: low, medium, high' },
      });
    }

    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    report.priority = priority.toLowerCase();
    await report.save();

    res.status(200).json({
      success: true,
      message: `Priority updated to ${priority.toLowerCase()}.`,
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve report with resolution photo and note
// @route   PATCH /api/reports/:id/resolve
// @access  Private (Government only)
const resolveReport = async (req, res, next) => {
  try {
    const { note, resolutionNote } = req.body;
    const finalNote = (note || resolutionNote || '').trim();

    if (!finalNote || finalNote.length === 0) {
      if (req.file) fs.unlink(req.file.path, () => {});
      return res.status(422).json({
        success: false,
        message: 'Resolution note is required.',
        errors: {
          note: 'Please provide details on how the issue was resolved.',
        },
      });
    }

    if (!req.file) {
      return res.status(422).json({
        success: false,
        message: 'Resolution proof photograph is required.',
        errors: {
          resolvedImage: 'Please upload a photo proving the issue has been resolved.',
        },
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
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    next(error);
  }
};

// @desc    Update report details (Citizen)
// @route   PUT /api/reports/:id
// @access  Private (Report owner)
const updateReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (!report.user.equals(req.user._id) && req.user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot edit this report.',
      });
    }

    // Only allow editing if pending
    if (report.status !== 'pending' && req.user.role !== 'government') {
      return res.status(409).json({
        success: false,
        message: `Cannot edit report because it is already '${report.status}'.`,
      });
    }

    const { title, description, category } = req.body;
    if (title && title.trim().length >= 5) report.title = title.trim();
    if (description && description.trim().length >= 10) report.description = description.trim();
    if (category) report.category = category.trim();

    if (req.file) {
      report.imageUrl = `/uploads/${req.file.filename}`;
      report.mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report updated successfully.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private (Owner or Government)
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    if (!report.user.equals(req.user._id) && req.user.role !== 'government') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You cannot delete this report.',
      });
    }

    // Delete image if exists
    if (report.imageUrl) {
      const filename = path.basename(report.imageUrl);
      const filePath = path.join(__dirname, '../uploads', filename);
      fs.unlink(filePath, () => {});
    }

    // Delete associated notifications
    await Notification.deleteMany({ reportId: report._id });
    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report stats for dashboard
// @route   GET /api/reports/stats
// @access  Private
const getReportStats = async (req, res, next) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
