const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const authRoutes = require('./routes/auth.routes');
const extensionRoutes = require('./routes/extension.routes');
const userRoutes = require('./routes/user.routes');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const extensionsRepo = require('./repositories/extensions.repo');

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
const isDev = process.env.NODE_ENV !== 'production' && !process.env.VERCEL;

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // No Origin header = same-origin or non-browser request.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (isDev && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
      return callback(null, false);
    },
  })
);
app.use(express.json({ limit: '2mb' }));

// Development request log: method, path, status and duration only (no bodies or headers).
if (isDev) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl.split('?')[0]} ${res.statusCode} ${Date.now() - start}ms`));
    next();
  });
}
app.use('/api', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/user', userRoutes);

const health = async (req, res) => {
  let database = 'unconfigured';
  try {
    database = (await extensionsRepo.ping()) ? 'ok' : 'error';
  } catch {
    database = 'unconfigured';
  }
  res.status(database === 'ok' ? 200 : 503).json({ status: database === 'ok' ? 'ok' : 'degraded', database });
};
app.get('/health', health);
app.get('/api/health', health);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler: client errors keep their message, server errors are generic.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body' });
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error('Server error:', err.message);
  res.status(status).json({
    message: status < 500 ? err.message : status === 503 ? 'Service temporarily unavailable' : 'Something went wrong. Please try again.',
  });
});

const PORT = process.env.PORT || 5050;

if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

module.exports = app;
