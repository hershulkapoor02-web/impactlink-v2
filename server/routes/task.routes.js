const express = require('express');
const Task   = require('../models/Task');
const { Notification } = require('../models/Need');
const User   = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { getTopMatches, getMatchedTasks } = require('../services/matching');
const router = express.Router();

// GET /api/tasks — browse all (volunteers, coordinators, admins)
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, category, urgency, search, page = 1, limit = 12, matched } = req.query;
    const q = {};
    if (status)   q.status = status; else q.status = { $in: ['open', 'in_progress'] };
    if (category) q.category = category;
    if (urgency)  q.severityScore = { $gte: Number(urgency) };
    if (search)   q.title = { $regex: search, $options: 'i' };

    let tasks = await Task.find(q)
      .populate('orgId', 'name logo category')
      .populate('createdBy', 'name')
      .sort({ urgencyScore: -1, createdAt: -1 })
      .skip((page - 1) * limit).limit(Number(limit));

    // Smart match sort for volunteers
    if (matched === 'true' && req.user.role === 'volunteer') {
      tasks = await getMatchedTasks(req.user, tasks);
    }

    const total = await Task.countDocuments(q);
    res.json({ success: true, tasks, total, pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
});

// GET /api/tasks/my-matches — volunteer's personal best matches
router.get('/my-matches', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const openTasks = await Task.find({ status: 'open' })
      .populate('orgId', 'name logo')
      .sort({ urgencyScore: -1 });
    const matched = await getMatchedTasks(req.user, openTasks);
    res.json({ success: true, tasks: matched.slice(0, 10) });
  } catch (err) { next(err); }
});

// GET /api/tasks/mine — volunteer's applied/assigned tasks
router.get('/mine', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const tasks = await Task.find({
      $or: [{ assignedVolunteers: req.user._id }, { 'applicants.user': req.user._id }]
    }).populate('orgId', 'name logo').sort({ scheduledDate: 1, createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) { next(err); }
});

// GET /api/tasks/org — org's tasks
router.get('/org', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const q = req.user.role === 'super_admin' ? {} : { orgId: req.user.orgId };
    const tasks = await Task.find(q)
      .populate('orgId', 'name logo')
      .populate('assignedVolunteers', 'name avatar skills')
      .sort({ createdAt: -1 });
    res.json({ success: true, tasks });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('orgId', 'name logo description email location')
      .populate('createdBy', 'name avatar')
      .populate('assignedVolunteers', 'name avatar skills')
      .populate('applicants.user', 'name avatar skills location availability');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// POST /api/tasks
router.post('/', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, orgId: req.user.orgId || req.body.orgId, createdBy: req.user._id });
    // Notify volunteers about urgent task
    if (task.severityScore >= 4) {
      const vols = await User.find({ role: 'volunteer', isActive: true }).select('_id');
      const notifs = vols.slice(0, 100).map(v => ({
        userId: v._id, type: 'urgent_task',
        title: '🚨 Urgent task posted',
        message: `High-urgency task: "${task.title}" needs volunteers now.`,
        link: `/volunteer/tasks`, relatedId: task._id
      }));
      await Notification.insertMany(notifs);
    }
    res.status(201).json({ success: true, task });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id
router.put('/:id', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/apply
router.post('/:id/apply', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.status !== 'open') return res.status(400).json({ success: false, message: 'Task not available' });
    if (task.applicants.find(a => a.user.toString() === req.user._id.toString())) {
      return res.status(400).json({ success: false, message: 'Already applied' });
    }
    const { scoreVolunteer } = require('../services/matching');
    const score = scoreVolunteer(req.user, task);
    task.applicants.push({ user: req.user._id, matchScore: score });
    await task.save();
    // Confirmation notification
    await Notification.create({
      userId: req.user._id, type: 'application_update',
      title: 'Application submitted',
      message: `You applied for "${task.title}". We'll notify you when reviewed.`,
      relatedId: task._id
    });
    res.json({ success: true, message: 'Application submitted', matchScore: score });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id/applicants/:userId — accept/reject
router.put('/:id/applicants/:userId', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const app = task.applicants.find(a => a.user.toString() === req.params.userId);
    if (!app) return res.status(404).json({ success: false, message: 'Applicant not found' });
    app.status = status;

    if (status === 'accepted') {
      if (!task.assignedVolunteers.map(v => v.toString()).includes(req.params.userId)) {
        task.assignedVolunteers.push(req.params.userId);
        task.attendance.push({ user: req.params.userId });
      }
      if (task.status === 'open' && task.assignedVolunteers.length >= task.minVolunteers) {
        task.status = 'in_progress';
      }
      await Notification.create({
        userId: req.params.userId, type: 'task_assigned',
        title: '✅ Application accepted!',
        message: `You've been assigned to "${task.title}".`,
        link: `/volunteer/my-tasks`, relatedId: task._id
      });
      // Shift reminder (in-app)
      if (task.scheduledDate) {
        await Notification.create({
          userId: req.params.userId, type: 'task_reminder',
          title: '⏰ Upcoming shift reminder',
          message: `Your task "${task.title}" is scheduled for ${new Date(task.scheduledDate).toLocaleDateString()}.`,
          link: `/volunteer/my-tasks`, relatedId: task._id
        });
      }
    } else {
      await Notification.create({
        userId: req.params.userId, type: 'application_update',
        title: 'Application update',
        message: `Your application for "${task.title}" was not selected this time.`,
        relatedId: task._id
      });
    }
    await task.save();
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/checkin — volunteer checks in
router.post('/:id/checkin', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const record = task.attendance.find(a => a.user.toString() === req.user._id.toString());
    if (!record) return res.status(403).json({ success: false, message: 'Not assigned to this task' });
    if (record.checkedIn) return res.status(400).json({ success: false, message: 'Already checked in' });
    record.checkedIn = true;
    record.checkedInAt = new Date();
    await task.save();
    res.json({ success: true, message: 'Checked in successfully' });
  } catch (err) { next(err); }
});

// POST /api/tasks/:id/checkout — volunteer checks out
router.post('/:id/checkout', protect, authorize('volunteer'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    const record = task.attendance.find(a => a.user.toString() === req.user._id.toString());
    if (!record?.checkedIn || record.checkedOutAt) {
      return res.status(400).json({ success: false, message: 'Cannot check out' });
    }
    record.checkedOutAt = new Date();
    const ms = record.checkedOutAt - record.checkedInAt;
    record.hoursLogged = parseFloat((ms / 3600000).toFixed(2));
    await task.save();
    // Update user total hours
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalHours: record.hoursLogged } });
    res.json({ success: true, hoursLogged: record.hoursLogged });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id/verify/:userId — coordinator verifies attendance
router.put('/:id/verify/:userId', protect, authorize('coordinator', 'ngo_admin', 'super_admin'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    const record = task.attendance.find(a => a.user.toString() === req.params.userId);
    if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
    record.verified = true;
    record.verifiedBy = req.user._id;
    // If manually providing hours
    if (req.body.hoursLogged) record.hoursLogged = req.body.hoursLogged;
    await task.save();
    // Update user stats
    await User.findByIdAndUpdate(req.params.userId, {
      $inc: { totalHours: record.hoursLogged > 0 ? 0 : (task.durationHours || 4) }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// PUT /api/tasks/:id/complete
router.put('/:id/complete', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, {
      status: 'completed', completedAt: new Date()
    }, { new: true });
    // Increment tasksCompleted for assigned volunteers
    await User.updateMany({ _id: { $in: task.assignedVolunteers } }, { $inc: { tasksCompleted: 1 } });
    res.json({ success: true, task });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id/matches — top matched volunteers for a task
router.get('/:id/matches', protect, authorize('ngo_admin', 'coordinator', 'super_admin'), async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    const matches = await getTopMatches(task, 10);
    res.json({ success: true, matches: matches.map(m => ({ ...m.volunteer.toObject(), matchScore: m.score })) });
  } catch (err) { next(err); }
});

module.exports = router;
