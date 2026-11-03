// Per-request AI context: which keys to use for the current user.
// Set by middleware/aiContext.middleware.js; read by services/ai/providers.js.
const { AsyncLocalStorage } = require('async_hooks');

const store = new AsyncLocalStorage();

// ctx: { keys: { groq?, gemini?, openrouter? }, byokOnly: boolean }
const runWithAiContext = (ctx, fn) => store.run(ctx, fn);
const getAiContext = () => store.getStore() || { keys: {}, byokOnly: false };

// The key a provider should use right now, or null if it must not be used.
const resolveKey = (provider, envName) => {
  const { keys, byokOnly } = getAiContext();
  const own = keys?.[provider];
  if (own) return own;
  if (byokOnly) return null;
  return process.env[envName] || null;
};

module.exports = { runWithAiContext, getAiContext, resolveKey };
