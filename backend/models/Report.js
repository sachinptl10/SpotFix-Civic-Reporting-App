const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'resolved'],
    },
    note: {
      type: String,
      default: '',
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    reportNumber: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must be linked to a user'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: [
          'roads',
          'sanitation',
          'electricity',
          'water',
          'drainage',
          'public-property',
          'other',
          // Backward compatibility mappings
          'Pothole',
          'Garbage',
          'Broken Streetlight',
          'Damaged Road',
          'Water Leakage',
          'Drainage Problem',
          'Public Property Damage',
          'Other',
        ],
        message: '{VALUE} is not a valid category',
      },
      default: 'other',
      index: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    mediaType: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude coordinate is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90'],
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude coordinate is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180'],
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'under_review', 'approved', 'rejected', 'resolved'],
        message: '{VALUE} is not a valid status',
      },
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewNote: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedImageUrl: {
      type: String,
      default: '',
    },
    resolutionNote: {
      type: String,
      default: '',
      trim: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance triage and government queues
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ category: 1, priority: 1, createdAt: -1 });
reportSchema.index({
  title: 'text',
  description: 'text',
  address: 'text',
  reportNumber: 'text',
});

module.exports = mongoose.model('Report', reportSchema);
