const mongoose = require('mongoose');

const extensionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
  },
  prompt: {
    type: String,
    required: [true, 'Please provide the original prompt'],
  },
  files: [
    {
      filename: {
        type: String,
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
    },
  ],
  zipPath: {
    type: String,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  cloneCount: {
    type: Number,
    default: 0,
  },
  storeAssets: {
    logoUrl: String,
    bannerUrl: String,
    description: String,
  },
  monetizationLink: {
    type: String,
    default: null,
  },
  iterationHistory: [
    {
      prompt: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt before saving
extensionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Extension', extensionSchema);
