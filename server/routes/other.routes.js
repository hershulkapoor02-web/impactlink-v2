const express  = require('express');
const { Need, Report, Notification } = require('../models/Need');
const Org      = require('../models/Org');
const User     = require('../models/User');
const Task     = require('../models/Task');
const { protect, authorize } = require('../middleware/auth');

// ── NEEDS ──────────────────────────────────────────────────────────────────────
const needRouter = express.Router();

needRouter.get('/', protect, async (req, res, next) => {
  try {
    const { category, status, area, page = 1, limit = 50 } = req.query;
    const q = {};
    if (category) q.category = category;
    if (status)   q.status = status;
    if (area)     q['location.area'] = { $regex: area, $options: 'i' };
    const needs = await Need.find(q)
      .populate('orgId', 'name logo')
      .sort({ urgencyScore: -1, dateReported: -1 })
      .skip((page - 1) * limit).limit(Number(limit));
    const total = await Need.countDocuments(q);
    res.json({ success: true, needs, total });
  } catch (err) { next(err); }
});

needRouter.post('/', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const need = await Need.create({ ...req.body, orgId: req.user.orgId || req.body.orgId, createdBy: req.user._id });
    res.status(201).json({ success: true, need });
  } catch (err) { next(err); }
});

needRouter.put('/:id', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const need = await Need.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, need });
  } catch (err) { next(err); }
});

needRouter.delete('/:id', protect, authorize('ngo_admin', 'super_admin'), async (req, res, next) => {
  try {
    await Need.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── ORGS ──────────────────────────────────────────────────────────────────────
const orgRouter = express.Router();

orgRouter.get('/', protect, async (req, res, next) => {
  try {
    const { status } = req.query;
    const q = req.user.role === 'super_admin' ? {} : { verificationStatus: 'approved' };
    if (status && req.user.role === 'super_admin') q.verificationStatus = status;
    const orgs = await Org.find(q).sort({ createdAt: -1 });
    res.json({ success: true, orgs });
  } catch (err) { next(err); }
});

orgRouter.get('/mine', protect, authorize('ngo_admin', 'coordinator'), async (req, res, next) => {
  try {
    const org = await Org.findById(req.user.orgId).populate('adminIds', 'name email avatar');
    res.json({ success: true, org });
  } catch (err) { next(err); }
});

orgRouter.put('/:id', protect, authorize('ngo_admin', 'super_admin'), async (req, res, next) => {
  try {
    const org = await Org.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, org });
  } catch (err) { next(err); }
});

orgRouter.put('/:id/verify', protect, authorize('super_admin'), async (req, res, next) => {
  try {
    const { status, rejectionNote } = req.body; // 'approved' | 'rejected'
    const org = await Org.findByIdAndUpdate(req.params.id, {
      verificationStatus: status, verifiedAt: new Date(),
      verifiedBy: req.user._id, rejectionNote: rejectionNote || ''
    }, { new: true });
    const type = status === 'approved' ? 'org_approved' : 'org_rejected';
    const admins = await User.find({ orgId: org._id });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id, type,
        title: status === 'approved' ? '🎉 Organization approved!' : 'Organization not approved',
        message: status === 'approved'
          ? `${org.name} has been verified and is now live on ImpactLink.`
          : `${org.name} was not approved. Reason: ${rejectionNote || 'See admin note.'}`
      });
    }
    res.json({ success: true, org });
  } catch (err) { next(err); }
});

// ── USERS / VOLUNTEERS ───────────────────────────────────────────────────────
const userRouter = express.Router();

userRouter.get('/volunteers', protect, async (req, res, next) => {
  try {
    const { skills, availability, search, page = 1, limit = 24 } = req.query;
    const q = { role: 'volunteer', isActive: true };
    if (skills)       q.skills = { $in: skills.split(',') };
    if (availability) q.availability = availability;
    if (search)       q.name = { $regex: search, $options: 'i' };
    const users = await User.find(q).select('-password').skip((page-1)*limit).limit(Number(limit));
    const total = await User.countDocuments(q);
    res.json({ success: true, users, total });
  } catch (err) { next(err); }
});

userRouter.get('/leaderboard', protect, async (req, res, next) => {
  try {
    const users = await User.find({ role: 'volunteer', isActive: true })
      .select('name avatar tasksCompleted totalHours skills joinedAt')
      .sort({ totalHours: -1, tasksCompleted: -1 })
      .limit(25);
    res.json({ success: true, users });
  } catch (err) { next(err); }
});

userRouter.get('/stats', protect, authorize('super_admin', 'ngo_admin'), async (req, res, next) => {
  try {
    const orgFilter = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const [totalUsers, totalVolunteers, totalNGOs, totalTasks, completedTasks] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'volunteer' }),
      Org.countDocuments(),
      Task.countDocuments(orgFilter),
      Task.countDocuments({ ...orgFilter, status: 'completed' })
    ]);
    const [tasksByStatus, needsByCategory, tasksByCategory] = await Promise.all([
      Task.aggregate([{ $match: orgFilter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Need.aggregate([{ $group: { _id: '$category', count: { $sum: 1 }, avgUrgency: { $avg: '$urgencyScore' } } }]),
      Task.aggregate([{ $match: orgFilter }, { $group: { _id: '$category', count: { $sum: 1 } } }])
    ]);
    const hoursResult = await User.aggregate([{ $group: { _id: null, total: { $sum: '$totalHours' } } }]);
    const totalHours = hoursResult[0]?.total || 0;
    res.json({ success: true, stats: { totalUsers, totalVolunteers, totalNGOs, totalTasks, completedTasks, totalHours, tasksByStatus, needsByCategory, tasksByCategory } });
  } catch (err) { next(err); }
});

// Volunteer hours certificate data
userRouter.get('/me/certificate', protect, async (req, res, next) => {
  try {
    const uid = req.user._id
    const user = await User.findById(uid).select('-password').populate('orgId', 'name')
    const tasks = await Task.find({ assignedVolunteers: uid, status: 'completed' }).populate('orgId', 'name')
    return res.json({ success: true, user: user.toPublic(), completedTasks: tasks })
  } catch (err) { next(err) }
})

userRouter.get('/:id/certificate', protect, async (req, res, next) => {
  try {
    const uid = req.params.id;
    if (req.params.id !== 'me' && req.user.role === 'volunteer' && req.user._id.toString() !== uid.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const user = await User.findById(uid).select('-password').populate('orgId', 'name');
    const tasks = await Task.find({ assignedVolunteers: uid, status: 'completed' }).populate('orgId', 'name');
    res.json({ success: true, user: user.toPublic(), completedTasks: tasks });
  } catch (err) { next(err); }
});

// ── NOTIFICATIONS ──────────────────────────────────────────────────────────────
const notifRouter = express.Router();

notifRouter.get('/', protect, async (req, res, next) => {
  try {
    const notifs = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(40);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ success: true, notifications: notifs, unreadCount });
  } catch (err) { next(err); }
});

notifRouter.put('/read-all', protect, async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

notifRouter.put('/:id/read', protect, async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = { needRouter, orgRouter, userRouter, notifRouter };
