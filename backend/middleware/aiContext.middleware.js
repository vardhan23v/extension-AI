const keysRepo = require('../repositories/keys.repo');
const { isConfigured } = require('../services/crypto.service');
const { runWithAiContext } = require('../services/ai/context');

// Loads the signed-in user's own AI keys (if any) for the rest of the request.
// Must run after authMiddleware. Falls back to platform keys on any lookup error,
// unless the user chose BYOK-only, in which case the request fails clearly.
const aiContext = async (req, res, next) => {
  let ctx = { keys: {}, byokOnly: false };
  if (isConfigured() && req.user?.userId) {
    try {
      const [keys, settings] = await Promise.all([keysRepo.getDecrypted(req.user.userId), keysRepo.getSettings(req.user.userId)]);
      ctx = { keys, byokOnly: settings.byokOnly };
    } catch (err) {
      console.error('Loading user AI keys failed:', err.message);
    }
  }
  req.usesOwnKeys = Object.keys(ctx.keys).length > 0;
  runWithAiContext(ctx, () => next());
};

module.exports = aiContext;
