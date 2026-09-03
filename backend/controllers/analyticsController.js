const Report = require('../models/Report');

// @desc    Get comprehensive civic issue analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Government only)
const getAnalyticsSummary = async (req, res, next) => {
  try {
    const [total, statusAgg, categoryAgg, priorityAgg, resolvedReports] = await Promise.all([
      Report.countDocuments(),
      Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
      ]),
      Report.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
      Report.find({ status: 'resolved', resolvedAt: { $ne: null } })
        .select('createdAt resolvedAt')
        .limit(100),
    ]);

    // Build byStatus map
    const byStatus = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      resolved: 0,
    };
    statusAgg.forEach((item) => {
      if (item._id && byStatus[item._id] !== undefined) {
        byStatus[item._id] = item.count;
      }
    });

    // Build byCategory map
    const byCategory = {
      roads: 0,
      sanitation: 0,
      electricity: 0,
      water: 0,
      drainage: 0,
      'public-property': 0,
      other: 0,
    };
    categoryAgg.forEach((item) => {
      const key = (item._id || '').toLowerCase();
      if (byCategory[key] !== undefined) {
        byCategory[key] += item.count;
      } else if (key.includes('road') || key.includes('pothole')) {
        byCategory.roads += item.count;
      } else if (key.includes('garbage') || key.includes('sanitation')) {
        byCategory.sanitation += item.count;
      } else if (key.includes('streetlight') || key.includes('electricity')) {
        byCategory.electricity += item.count;
      } else if (key.includes('water')) {
        byCategory.water += item.count;
      } else if (key.includes('drainage')) {
        byCategory.drainage += item.count;
      } else if (key.includes('public property')) {
        byCategory['public-property'] += item.count;
      } else {
        byCategory.other += item.count;
      }
    });

    // Build byPriority map
    const byPriority = {
      high: 0,
      medium: 0,
      low: 0,
    };
    priorityAgg.forEach((item) => {
      if (item._id && byPriority[item._id] !== undefined) {
        byPriority[item._id] = item.count;
      }
    });

    // Calculate resolution rate
    const actionedCount = byStatus.approved + byStatus.resolved + byStatus.rejected;
    const resolutionRate = total > 0 ? Math.round((byStatus.resolved / total) * 100) : 0;

    // Calculate average resolution time (hours)
    let totalResolutionHours = 0;
    resolvedReports.forEach((r) => {
      if (r.resolvedAt && r.createdAt) {
        const diffMs = new Date(r.resolvedAt) - new Date(r.createdAt);
        totalResolutionHours += Math.max(0, diffMs / (1000 * 60 * 60));
      }
    });
    const avgResolutionHours =
      resolvedReports.length > 0 ? (totalResolutionHours / resolvedReports.length).toFixed(1) : 'N/A';

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus,
        byCategory,
        byPriority,
        resolutionRate,
        avgResolutionHours,
        activeReviewCount: byStatus.pending + byStatus.under_review,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsSummary,
};
