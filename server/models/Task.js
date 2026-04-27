const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:    { type: String, enum: ['pending','accepted','rejected'], default: 'pending' },
  matchScore:{ type: Number, default: 0 },
  appliedAt: { type: Date, default: Date.now }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  checkedIn:    { type: Boolean, default: false },
  checkedInAt:  { type: Date },
  checkedOutAt: { type: Date },
  hoursLogged:  { type: Number, default: 0 },
  verified:     { type: Boolean, default: false },
  verifiedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title:           { type: String, required: true, trim: true },
  description:     { type: String, required: true },
  orgId:           { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillsRequired:  [{ type: String }],
  location: {
    city:  { type: String, default: '' },
    state: { type: String, default: '' },
    lat:   { type: Number, default: 0 },
    lng:   { type: Number, default: 0 }
  },
  category: {
    type: String,
    enum: ['food','medical','shelter','education','environment','logistics','tech','legal','other'],
    default: 'other'
  },
  // Urgency
  severityScore:   { type: Number, min: 1, max: 5, default: 3 },
  urgencyScore:    { type: Number, default: 0 }, // computed
  status:          { type: String, enum: ['open','in_progress','completed','cancelled'], default: 'open' },
  // Scheduling
  scheduledDate:   { type: Date },
  deadline:        { type: Date },
  durationHours:   { type: Number, default: 4 },
  // Volunteers
  maxVolunteers:   { type: Number, default: 1 },
  minVolunteers:   { type: Number, default: 1 },
  assignedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  applicants:      [applicantSchema],
  attendance:      [attendanceSchema],
  // Links back to need
  linkedNeedId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Need', default: null },
  completedAt:     { type: Date }
}, { timestamps: true });

// Compute urgency score: weights recency + severity + report count
taskSchema.pre('save', function(next) {
  const daysSinceCreated = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  const recencyFactor = Math.max(0, 10 - daysSinceCreated * 0.5);
  const overdueBonus = this.deadline && this.deadline < new Date() ? 15 : 0;
  this.urgencyScore = (this.severityScore * 15) + recencyFactor + overdueBonus;
  next();
});

taskSchema.index({ status: 1, urgencyScore: -1 });
taskSchema.index({ orgId: 1, status: 1 });

module.exports = mongoose.model('Task', taskSchema);
