const Report = require('../models/Report');
const Notification = require('../models/Notification');

// Strict allowed transition state machine
const ALLOWED_TRANSITIONS = {
  pending: ['under_review'],
  under_review: ['approved', 'rejected'],
  approved: ['resolved'],
  rejected: [],
  resolved: [],
};

/**
 * Generate unique human-readable report number (e.g. SP-10042)
 */
const generateReportNumber = async () => {
  const count = await Report.countDocuments();
  const baseNumber = 10000 + count + 1;
  let candidate = `SP-${baseNumber}`;

  // Ensure collision avoidance
  let exists = await Report.findOne({ reportNumber: candidate });
  let attempts = 0;
  while (exists && attempts < 10) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    candidate = `SP-${baseNumber}-${randomSuffix}`;
    exists = await Report.findOne({ reportNumber: candidate });
    attempts++;
  }

  return candidate;
};

/**
 * Validate status transition
 * Returns { allowed: boolean, reason?: string }
 */
const validateTransition = (currentStatus, targetStatus) => {
  const validTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (validTargets.includes(targetStatus)) {
    return { allowed: true };
  }

  let reason = `Cannot change status from '${currentStatus}' to '${targetStatus}'.`;
  if (currentStatus === 'rejected') {
    reason = 'A rejected report cannot be reopened, approved, or resolved.';
  } else if (currentStatus === 'resolved') {
    reason = 'A resolved report is complete and cannot be transitioned.';
  } else if (currentStatus === 'pending' && (targetStatus === 'approved' || targetStatus === 'rejected')) {
    reason = "A report must be marked 'under_review' before it can be approved or rejected.";
  } else if (currentStatus === 'pending' && targetStatus === 'resolved') {
    reason = "A report cannot be resolved directly from 'pending'. It must first be reviewed and approved.";
  } else if (currentStatus === 'under_review' && targetStatus === 'resolved') {
    reason = "A report must be 'approved' before it can be marked as 'resolved'.";
  }

  return { allowed: false, reason };
};

/**
 * Perform a status transition, write status history, and create notification for citizen
 */
const transitionReportStatus = async ({
  reportId,
  targetStatus,
  user, // Government official or actor
  note = '',
  extraFields = {},
}) => {
  const report = await Report.findById(reportId);
  if (!report) {
    const err = new Error('Report not found');
    err.status = 404;
    throw err;
  }

  // Check state machine
  const check = validateTransition(report.status, targetStatus);
  if (!check.allowed) {
    const err = new Error(check.reason);
    err.status = 409; // Conflict
    throw err;
  }

  // Update report attributes
  report.status = targetStatus;
  report.reviewedBy = user._id;

  if (targetStatus === 'under_review') {
    if (!report.reviewNote && note) report.reviewNote = note;
  } else if (targetStatus === 'approved' || targetStatus === 'rejected') {
    report.reviewNote = note;
  } else if (targetStatus === 'resolved') {
    report.resolvedAt = new Date();
    if (note) report.resolutionNote = note;
    if (extraFields.resolvedImageUrl) {
      report.resolvedImageUrl = extraFields.resolvedImageUrl;
    }
  }

  // Append audit trail to statusHistory
  report.statusHistory.push({
    status: targetStatus,
    note: note || `Report transitioned to ${targetStatus.replace('_', ' ')}`,
    changedBy: user._id,
    timestamp: new Date(),
  });

  await report.save();

  // Create citizen notification
  let notificationType = targetStatus;
  let notificationMessage = '';
  const ref = report.reportNumber ? `#${report.reportNumber}` : 'Your report';

  switch (targetStatus) {
    case 'under_review':
      notificationMessage = `${ref} ("${report.title}") is now Under Review by municipal officials.`;
      break;
    case 'approved':
      notificationMessage = `${ref} ("${report.title}") has been Approved for municipal work.${note ? ` Note: ${note}` : ''}`;
      break;
    case 'rejected':
      notificationMessage = `${ref} ("${report.title}") was Rejected.${note ? ` Reason: ${note}` : ''}`;
      break;
    case 'resolved':
      notificationMessage = `${ref} ("${report.title}") has been Resolved! Resolution proof and notes are now available.`;
      break;
    default:
      notificationMessage = `Status update for ${ref}: ${targetStatus}`;
  }

  try {
    await Notification.create({
      userId: report.user,
      reportId: report._id,
      type: notificationType,
      message: notificationMessage,
      isRead: false,
    });
  } catch (notifErr) {
    console.warn('[Workflow] Failed to write notification record:', notifErr.message);
  }

  return report;
};

module.exports = {
  ALLOWED_TRANSITIONS,
  generateReportNumber,
  validateTransition,
  transitionReportStatus,
};
