const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// ── protect ───────────────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ success: false, message: 'Not authorized — no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or deactivated' });
    }
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ── authorize ─────────────────────────────────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not authorized` });
  }
  next();
};

// ── errorHandler ──────────────────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let message = err.message || 'Server error';
  let status  = err.statusCode || 500;

  if (err.name === 'CastError')        { message = 'Resource not found';              status = 404; }
  if (err.code === 11000)              { message = `${Object.keys(err.keyValue)[0]} already exists`; status = 400; }
  if (err.name === 'ValidationError')  { message = Object.values(err.errors).map(e => e.message).join(', '); status = 400; }

  if (process.env.NODE_ENV === 'development') console.error(err);
  res.status(status).json({ success: false, message });
};

module.exports = { protect, authorize, errorHandler };
