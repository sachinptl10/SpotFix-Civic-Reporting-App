const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');

// @desc    Create a new civic issue report
// @route   POST /api/reports
// @access  Private
const createReport = async (req, res, next) => {
  try {
    const { title, description, category, latitude, longitude, address } = req.body;
    const errors = {};

    // Validate Title
    if (!title || title.trim().length === 0) {
      errors.title = 'Issue title is required.';
    } else if (title.trim().length < 5) {
      errors.title = 'Title must be at least 5 characters.';
    } else if (title.trim().length > 150) {
      errors.title = 'Title cannot exceed 150 characters.';
    }

    // Validate Description
    if (!description || description.trim().length === 0) {
      errors.description = 'Description is required.';
    } else if (description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    } else if (description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters.';
    }

    // Validate Category
    const validCategories = [
      'Pothole',
      'Garbage',
      'Broken Streetlight',
      'Damaged Road',
      'Water Leakage',
      'Drainage Problem',
      'Public Property Damage',
      'Other',
    ];
    if (!category || !validCategories.includes(category)) {
      errors.category = 'Please select a valid issue category.';
    }

    // Validate Latitude & Longitude
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'A valid latitude between -90 and 90 is required.';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'A valid longitude between -180 and 180 is required.';
    }

    // Validate Address
    if (!address || address.trim().length === 0) {
      errors.address = 'Street address or location description is required.';
    }

    // Validate Media File
    if (!req.file) {
      errors.image = 'An issue photograph or video is required.';
    }

    // Return structured 422 Unprocessable Entity if validation fails
    if (Object.keys(errors).length > 0) {
      // If a file was uploaded before validation failed, clean it up
      if (req.file) {
        const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }

      return res.status(422).json({
        success: false,
        message: 'Validation failed. Please correct the highlighted errors.',
        errors,
      });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const isVideo = req.file.mimetype.startsWith('video/');

    const report = await Report.create({
      user: req.user._id,
      title: title.trim(),
      description: description.trim(),
      category: category.trim(),
      latitude: lat,
      longitude: lng,
      address: address.trim(),
      imageUrl,
      mediaType: isVideo ? 'video' : 'image',
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Civic issue report created successfully.',
      report,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reports with pagination, text search & filters
// @route   GET /api/reports
// @access  Private
const getReports = async (req, res, next) => {
  try {
    const { scope, category, status, q } = req.query;

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by user unless scope=all is explicitly passed
    if (scope !== 'all') {
      query.user = req.user._id;
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Status filter
    if (status) {
      if (status === 'Pending') {
        query.status = { $in: ['Pending', 'Submitted'] };
      } else if (status === 'In Progress') {
        query.status = { $in: ['In Progress', 'Under Review'] };
      } else {
        query.status = status;
      }
    }

    // Text search query across title, description, address
    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { category: searchRegex },
      ];
    }

    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const pages = Math.ceil(total / limit) || 1;
    const hasMore = page < pages;

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      page,
      pages,
      hasMore,
      reports,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Private
const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id).populate('user', 'name email');

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found with the provided ID.',
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

// @desc    Update a report
// @route   PUT /api/reports/:id
// @access  Private
const updateReport = async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Verify ownership
    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to edit this report.',
      });
    }

    const { title, description, category, status, latitude, longitude, address } = req.body;
    const errors = {};

    if (title !== undefined) {
      if (title.trim().length < 5) errors.title = 'Title must be at least 5 characters.';
      if (title.trim().length > 150) errors.title = 'Title cannot exceed 150 characters.';
    }

    if (description !== undefined) {
      if (description.trim().length < 10) errors.description = 'Description must be at least 10 characters.';
      if (description.trim().length > 1000) errors.description = 'Description cannot exceed 1000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed.',
        errors,
      });
    }

    if (title) report.title = title.trim();
    if (description) report.description = description.trim();
    if (category) report.category = category.trim();
    if (status) report.status = status.trim();
    if (address) report.address = address.trim();

    if (latitude !== undefined && longitude !== undefined) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        report.latitude = lat;
        report.longitude = lng;
      }
    }

    // If replacement media file uploaded
    if (req.file) {
      const oldFilename = path.basename(report.imageUrl);
      const oldFilePath = path.join(__dirname, '..', 'uploads', oldFilename);

      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (err) {}
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
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
const deleteReport = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.',
      });
    }

    // Ownership check
    if (report.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are only permitted to delete your own reports.',
      });
    }

    // Clean up uploaded media file
    if (report.imageUrl) {
      const filename = path.basename(report.imageUrl);
      const filePath = path.join(__dirname, '..', 'uploads', filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (err) {}
      }
    }

    await Report.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Private
const getReportStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const total = await Report.countDocuments({ user: userId });
    const resolved = await Report.countDocuments({ user: userId, status: 'Resolved' });
    const inProgress = await Report.countDocuments({
      user: userId,
      status: { $in: ['In Progress', 'Under Review'] },
    });
    const pending = await Report.countDocuments({
      user: userId,
      status: { $in: ['Pending', 'Submitted'] },
    });
    const rejected = await Report.countDocuments({ user: userId, status: 'Rejected' });

    res.status(200).json({
      success: true,
      stats: {
        total,
        resolved,
        pending: pending + inProgress,
        pendingOnly: pending,
        inProgress,
        rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  getReportStats,
};
