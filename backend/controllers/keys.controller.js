const keysRepo = require('../repositories/keys.repo');
const { isConfigured } = require('../services/crypto.service');
const { PROVIDERS, isProvider, checkFormat, verifyKey } = require('../services/ai/keyCheck');

const COST_NOTES = {
  groq: 'Free tier with per-minute token limits; paid tiers bill per token.',
  gemini: 'Free tier with daily limits; paid usage billed per token by Google.',
  openrouter: 'Prepaid credits; price depends on the model used.',
};

const notConfigured = (res) => res.status(503).json({ message: 'Saving your own keys is not available on this server yet.' });

const listKeys = async (req, res, next) => {
  try {
    const available = isConfigured();
    const [saved, settings] = available ? await Promise.all([keysRepo.list(req.user.userId), keysRepo.getSettings(req.user.userId)]) : [[], { byokOnly: false }];
    res.json({
      success: true,
      available,
      byokOnly: settings.byokOnly,
      providers: Object.entries(PROVIDERS).map(([id, p]) => {
        const s = saved.find((k) => k.provider === id);
        return { id, label: p.label, costNote: COST_NOTES[id], saved: Boolean(s), last4: s?.last4 || null, savedAt: s?.created_at || null };
      }),
    });
  } catch (err) {
    next(err);
  }
};

const saveKey = async (req, res, next) => {
  try {
    if (!isConfigured()) return notConfigured(res);
    const { provider } = req.params;
    if (!isProvider(provider)) return res.status(404).json({ message: 'Unknown provider' });
    const key = typeof req.body.key === 'string' ? req.body.key.trim() : '';
    if (!checkFormat(provider, key)) return res.status(400).json({ message: `That doesn’t look like a ${PROVIDERS[provider].label} API key.` });
    const check = await verifyKey(provider, key);
    if (!check.ok) return res.status(400).json({ message: check.reason });
    const saved = await keysRepo.save(req.user.userId, provider, key);
    res.json({ success: true, provider, last4: saved.last4, note: check.note || null });
  } catch (err) {
    next(err);
  }
};

const testKey = async (req, res, next) => {
  try {
    if (!isConfigured()) return notConfigured(res);
    const { provider } = req.params;
    if (!isProvider(provider)) return res.status(404).json({ message: 'Unknown provider' });
    const key = (await keysRepo.getDecrypted(req.user.userId))[provider];
    if (!key) return res.status(404).json({ message: 'No key saved for this provider' });
    const check = await verifyKey(provider, key);
    res.json({ success: true, ok: check.ok, message: check.ok ? check.note || 'Key works' : check.reason });
  } catch (err) {
    next(err);
  }
};

const deleteKey = async (req, res, next) => {
  try {
    if (!isProvider(req.params.provider)) return res.status(404).json({ message: 'Unknown provider' });
    if (!isConfigured()) return notConfigured(res);
    const removed = await keysRepo.remove(req.user.userId, req.params.provider);
    if (!removed) return res.status(404).json({ message: 'No key saved for this provider' });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const saveSettings = async (req, res, next) => {
  try {
    if (!isConfigured()) return notConfigured(res);
    if (typeof req.body.byokOnly !== 'boolean') return res.status(400).json({ message: 'byokOnly must be true or false' });
    if (req.body.byokOnly) {
      const saved = await keysRepo.list(req.user.userId);
      if (!saved.length) return res.status(400).json({ message: 'Add at least one key before turning on “Use only my keys”.' });
    }
    const row = await keysRepo.saveSettings(req.user.userId, { byokOnly: req.body.byokOnly });
    res.json({ success: true, byokOnly: row.byok_only });
  } catch (err) {
    next(err);
  }
};

module.exports = { listKeys, saveKey, testKey, deleteKey, saveSettings };
