// Verifies a user-supplied API key with a cheap, read-only provider call.
const PROVIDERS = {
  groq: { label: 'Groq', format: /^gsk_[A-Za-z0-9]{20,}$/, url: 'https://api.groq.com/openai/v1/models', auth: (k) => ({ Authorization: `Bearer ${k}` }) },
  openrouter: { label: 'OpenRouter', format: /^sk-or-[A-Za-z0-9-_]{20,}$/, url: 'https://openrouter.ai/api/v1/key', auth: (k) => ({ Authorization: `Bearer ${k}` }) },
  gemini: { label: 'Google Gemini', format: /^AIza[0-9A-Za-z_-]{30,}$/, url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', auth: (k) => ({ 'x-goog-api-key': k }) },
};

const isProvider = (p) => Object.prototype.hasOwnProperty.call(PROVIDERS, p);

const checkFormat = (provider, key) => typeof key === 'string' && key.length <= 200 && PROVIDERS[provider].format.test(key.trim());

// Returns { ok: true } or { ok: false, reason }
const verifyKey = async (provider, key) => {
  const p = PROVIDERS[provider];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(p.url, { headers: p.auth(key), signal: controller.signal });
    if (res.ok) return { ok: true };
    if (res.status === 401 || res.status === 403) return { ok: false, reason: `${p.label} rejected this key` };
    if (res.status === 429) return { ok: true, note: `${p.label} is rate-limiting this key right now` };
    return { ok: false, reason: `${p.label} returned HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, reason: e.name === 'AbortError' ? `${p.label} did not respond in time` : `Could not reach ${p.label}` };
  } finally {
    clearTimeout(timer);
  }
};

module.exports = { PROVIDERS, isProvider, checkFormat, verifyKey };
