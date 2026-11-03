const rateLimit = require('express-rate-limit');

const keyByUser = (req) => req.user?.userId || req.ip;

// Limits expensive AI calls per user.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Users on their own keys pay for their own usage, so they get a higher ceiling.
  limit: (req) => (req.usesOwnKeys ? Number(process.env.AI_RATE_LIMIT_BYOK) || 200 : Number(process.env.AI_RATE_LIMIT) || 30),
  keyGenerator: keyByUser,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  message: { message: 'Too many AI requests. Please wait a few minutes and try again.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT) || 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = { aiLimiter, apiLimiter };
