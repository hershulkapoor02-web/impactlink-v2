const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  logo:        { type: String, default: '' },
  website:     { type: String, default: '' },
  email:       { type: String, required: true },
  phone:       { type: String, default: '' },
  location: {
    city:    { type: String, default: '' },
    state:   { type: String, default: '' },
    address: { type: String, default: '' }
  },
  category: {
    type: String,
    enum: ['education','health','environment','poverty','disaster_relief','women_empowerment','child_welfare','other'],
    default: 'other'
  },
  adminIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  coordinatorIds:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Verification
  verificationStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  verificationDocs:   [{ name: String, url: String, uploadedAt: Date }],
  verifiedAt:    { type: Date },
  verifiedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionNote: { type: String, default: '' },
  // Stats
  isActive:       { type: Boolean, default: true },
  totalTasks:     { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  totalHours:     { type: Number, default: 0 },
  volunteerCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Org', orgSchema);
