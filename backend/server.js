const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const extensionRoutes = require('./routes/extension.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

// Middleware
app.use(
  cors({
    origin: function(origin, callback) {
      // Allow same-origin requests (no origin header), Vercel preview URLs, and localhost
      if (!origin || origin.includes('.vercel.app') || origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(null, true); // Allow all for now - tighten in production if needed
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Connection - Fixed with IPv4
mongoose
  .connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    family: 4,
  })
  .then(() => console.log('✓ MongoDB connected'))
  .catch((err) => {
    console.error('✗ MongoDB connection error:', err.message);
    // Don't process.exit in serverless - let requests attempt to reconnect
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/extensions', extensionRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5050;

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`✓ Server running on port ${PORT}`);
  });
}

module.exports = app;