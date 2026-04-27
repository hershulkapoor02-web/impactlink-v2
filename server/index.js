require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/auth');

const authRoutes  = require('./routes/auth.routes');
const taskRoutes  = require('./routes/task.routes');
const { needRouter, orgRouter, userRouter, notifRouter } = require('./routes/other.routes');

connectDB();
const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use('/api/', limiter);

app.use('/api/auth',          authRoutes);
app.use('/api/tasks',         taskRoutes);
app.use('/api/needs',         needRouter);
app.use('/api/orgs',          orgRouter);
app.use('/api/users',         userRouter);
app.use('/api/notifications', notifRouter);

app.get('/api/health', (_, res) => res.json({ ok: true, version: '2.0.0', env: process.env.NODE_ENV }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ImpactLink v2 API on :${PORT}`));
