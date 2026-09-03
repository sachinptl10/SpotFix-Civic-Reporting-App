const Notification = require('../models/Notification');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get current user's notifications
// @route   GET /api/notifications
// @access  Private (Citizen)
const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
  const skip = (page - 1) * limit;

  const query = { userId: req.user._id };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reportId', 'title reportNumber status category priority imageUrl'),
    Notification.countDocuments(query),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  const pages = Math.ceil(total / limit) || 1;
  const hasMore = page < pages;

  res.status(200).json({
    success: true,
    notifications,
    total,
    unreadCount,
    page,
    pages,
    hasMore,
  });
});

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    userId: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    count,
  });
});

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!notification) {
    throw new AppError('Notification not found.', 404);
  }

  notification.isRead = true;
  await notification.save();

  res.status(200).json({
    success: true,
    message: 'Notification marked as read.',
    notification,
  });
});

// @desc    Mark all user's notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read.',
  });
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
