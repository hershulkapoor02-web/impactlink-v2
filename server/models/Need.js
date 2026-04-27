const mongoose = require('mongoose');

// ── Need ──────────────────────────────────────────────────────────────────────
const needSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  orgId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['food','medical','shelter','education','environment','logistics','tech','legal','other'],
    default: 'other'
  },
  location: {
    city:  { type: String, default: '' },
    state: { type: String, default: '' },
    area:  { type: String, default: '' },
    lat:   { type: Number, default: 0 },
    lng:   { type: Number, default: 0 }
  },
  // Scoring
  severityScore:   { type: Number, default: 3, min: 1, max: 5 },
  reportCount:     { type: Number, default: 1 },
  urgencyScore:    { type: Number, default: 0 },  // computed
  affectedPeople:  { type: Number, default: 0 },
  status:          { type: String, enum: ['active','in_progress','resolved'], default: 'active' },
  reportSource:    { type: mongoose.Schema.Types.ObjectId, ref: 'Report', default: null },
  linkedTaskIds:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  resolvedAt:      { type: Date },
  dateReported:    { type: Date, default: Date.now }
}, { timestamps: true });

// Urgency = severity * 15 + recency decay + report count weight
needSchema.pre('save', function(next) {
  const daysSince = (Date.now() - this.dateReported) / (1000 * 60 * 60 * 24);
  const recency = Math.max(0, 10 - daysSince * 0.3);
  this.urgencyScore = (this.severityScore * 15) + recency + (this.reportCount * 2);
  next();
});

needSchema.index({ urgencyScore: -1, status: 1 });

// ── Report ────────────────────────────────────────────────────────────────────
const reportSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  orgId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Org', required: true },
  uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileUrl:        { type: String, required: true },
  fileName:       { type: String, required: true },
  fileType:       { type: String, default: 'pdf' },
  status:         { type: String, enum: ['pending','processing','processed','failed'], default: 'pending' },
  needsExtracted: { type: Number, default: 0 },
  notes:          { type: String, default: '' }
}, { timestamps: true });

// ── Notification ──────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['task_assigned','task_reminder','urgent_task','application_update','org_approved','org_rejected','checkin_reminder','general'],
    default: 'general'
  },
  title:     { type: String, required: true },
  message:   { type: String, required: true },
  link:      { type: String, default: '' },
  isRead:    { type: Boolean, default: false },
  relatedId: { type: mongoose.Schema.Types.ObjectId, default: null }
}, { timestamps: true });

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Need         = mongoose.model('Need', needSchema);
const Report       = mongoose.model('Report', reportSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Need, Report, Notification };
