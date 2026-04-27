const express = require('express');
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Org     = require('../models/Org');
const { protect } = require('../middleware/auth');
const router  = express.Router();

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role, orgName, orgEmail, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, message: 'Name, email and password required' });
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email already registered' });

    const validRoles = ['volunteer', 'coordinator', 'ngo_admin'];
    const safeRole = validRoles.includes(role) ? role : 'volunteer';

    const user = await User.create({ name, email, password, role: safeRole, phone: phone || '' });

    if (safeRole === 'ngo_admin' && orgName) {
      const org = await Org.create({
        name: orgName, email: orgEmail || email,
        adminIds: [user._id], verificationStatus: 'pending'
      });
      user.orgId = org._id;
      await user.save();
    }

    res.status(201).json({ success: true, token: sign(user._id), user: user.toPublic() });
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated' });

    user.lastActive = new Date();
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, token: sign(user._id), user: user.toPublic() });
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('orgId', 'name logo verificationStatus category');
  res.json({ success: true, user: user.toPublic() });
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const allowed = ['name','bio','skills','availability','location','avatar','phone','preferences'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json({ success: true, user: user.toPublic() });
  } catch (err) { next(err); }
});

// PUT /api/auth/password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (err) { next(err); }
});

module.exports = router;
