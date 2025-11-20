const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'QR code is required'],
    unique: true
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher ID is required']
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiration time is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    default: 'Daily attendance QR code'
  },
  location: {
    type: String,
    default: 'Classroom'
  },
  course: {
    type: String,
    default: 'General'
  }
}, {
  timestamps: true
});

// Index for efficient queries
qrCodeSchema.index({ code: 1 });
qrCodeSchema.index({ generatedAt: 1 });
qrCodeSchema.index({ expiresAt: 1 });
qrCodeSchema.index({ isActive: 1 });

// Method to check if QR code is still valid
qrCodeSchema.methods.isValid = function() {
  return this.isActive && new Date() < this.expiresAt;
};

// Static method to get active QR codes
qrCodeSchema.statics.getActiveCodes = function() {
  return this.find({
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).populate('generatedBy', 'name email');
};

// Static method to deactivate expired codes
qrCodeSchema.statics.deactivateExpired = async function() {
  return this.updateMany(
    {
      isActive: true,
      expiresAt: { $lte: new Date() }
    },
    {
      $set: { isActive: false }
    }
  );
};

module.exports = mongoose.model('QRCode', qrCodeSchema); 