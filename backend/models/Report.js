const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Report must be linked to a user'],
    },
    title: {
      type: String,
      required: [true, 'Please provide an issue title'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a detailed description'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: {
        values: [
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
      default: 'Other',
    },
    imageUrl: {
      type: String,
      required: [true, 'Issue photograph or video is required'],
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
      required: [true, 'Physical address/location description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Submitted', 'Pending', 'Under Review', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Search and performance indexes
reportSchema.index({ user: 1, createdAt: -1 });
reportSchema.index({ latitude: 1, longitude: 1 });
reportSchema.index({ title: 'text', description: 'text', address: 'text' });

module.exports = mongoose.model('Report', reportSchema);
