const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const checkInSchema = new mongoose.Schema({
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  checkedInAt: Date,
  checkedOutAt: Date,
  hoursLogged: { type: Number, default: 0 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true },
  password:     { type: String, required: true, minlength: 6, select: false },
  role:         { type: String, enum: ['volunteer', 'coordinator', 'ngo_admin', 'super_admin'], default: 'volunteer' },
  avatar:       { type: String, default: '' },
  bio:          { type: String, default: '' },
  phone:        { type: String, default: '' },
  skills:       [{ type: String }],
  location: {
    city:  { type: String, default: '' },
    state: { type: String, default: '' },
    lat:   { type: Number, default: 0 },
    lng:   { type: Number, default: 0 }
  },
  availability: { type: String, enum: ['full_time','part_time','weekends','on_demand'], default: 'on_demand' },
  orgId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Org', default: null },
  isVerified:   { type: Boolean, default: false },
  isActive:     { type: Boolean, default: true },
  // Stats
  totalHours:       { type: Number, default: 0 },
  tasksCompleted:   { type: Number, default: 0 },
  tasksApplied:     { type: Number, default: 0 },
  checkIns:         [checkInSchema],
  // Preferences
  preferences: {
    theme:         { type: String, enum: ['light','dark','system'], default: 'system' },
    notifications: { type: Boolean, default: true }
  },
  lastActive:   { type: Date, default: Date.now },
  joinedAt:     { type: Date, default: Date.now }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.toPublic = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
