// Provider adapters. Keys come only from server environment variables and are
// never logged or returned to clients.

const DEFAULT_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 90000;

class ProviderError extends Error {
  constructor(provider, message, { retryable = false } = {}) {
    super(`${provider}: ${message}`);
    this.provider = provider;
    this.retryable = retryable;
  }
}

const fetchWithTimeout = async (url, options, timeoutMs) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

// Wait time suggested by a 429 response (Retry-After header or "try again in 7.5s").
const retryAfterMs = (res, data) => {
  const header = Number(res.headers?.get?.('retry-after'));
  if (header > 0) return header * 1000;
  const m = String(data?.error?.message || '').match(/try again in ([\d.]+)s/i);
  return m ? Number(m[1]) * 1000 : 0;
};

const openAiCompatible = (name, url, keyEnv, model) => ({
  name,
  isConfigured: () => Boolean(process.env[keyEnv]),
  async complete({ system, user, json = false, maxTokens = 8000, timeoutMs = DEFAULT_TIMEOUT_MS }) {
    let res;
    try {
      res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env[keyEnv]}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: user },
            ],
            ...(json ? { response_format: { type: 'json_object' } } : {}),
            max_tokens: maxTokens,
          }),
        },
        timeoutMs
      );
    } catch (e) {
      throw new ProviderError(name, e.name === 'AbortError' ? 'request timed out' : 'network error', { retryable: true });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Strict JSON mode can reject long code-heavy output; the caller extracts
      // JSON from plain text anyway, so retry once without it.
      if (json && res.status === 400 && /Failed to generate JSON|json_validate_failed/i.test(JSON.stringify(data.error || ''))) {
        return this.complete({ system, user, json: false, maxTokens, timeoutMs });
      }
      const retryable = res.status === 429 || res.status >= 500;
      const err = new ProviderError(name, `HTTP ${res.status} ${String(data.error?.message || '').slice(0, 200)}`, { retryable });
      err.retryAfterMs = retryAfterMs(res, data);
      throw err;
    }
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new ProviderError(name, 'empty response');
    return content;
  },
});

const gemini = {
  name: 'Gemini',
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  async complete({ system, user, json = false, maxTokens = 8000, timeoutMs = DEFAULT_TIMEOUT_MS }) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    let res;
    try {
      res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: user }] }],
            generationConfig: { maxOutputTokens: maxTokens, ...(json ? { responseMimeType: 'application/json' } : {}) },
          }),
        },
        timeoutMs
      );
    } catch (e) {
      throw new ProviderError('Gemini', e.name === 'AbortError' ? 'request timed out' : 'network error', { retryable: true });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const retryable = res.status === 429 || res.status >= 500;
      throw new ProviderError('Gemini', `HTTP ${res.status} ${String(data.error?.message || '').slice(0, 200)}`, { retryable });
    }
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
    if (!text) throw new ProviderError('Gemini', 'empty response');
    return text;
  },
};

const PROVIDERS = [
  openAiCompatible('Groq', 'https://api.groq.com/openai/v1/chat/completions', 'GROQ_API_KEY', process.env.GROQ_MODEL || 'openai/gpt-oss-120b'),
  gemini,
  openAiCompatible(
    'OpenRouter',
    'https://openrouter.ai/api/v1/chat/completions',
    'OPENROUTER_API_KEY',
    process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct'
  ),
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Tries each configured provider in order (one retry for retryable errors).
 * `parse` may throw to reject a response and move on to the next provider.
 */
const completeWithFallback = async (request, parse = (t) => t, { providers = PROVIDERS } = {}) => {
  const errors = [];
  const configured = providers.filter((p) => p.isConfigured());
  if (configured.length === 0) {
    throw new ProviderError('AI', 'no AI provider is configured on the server');
  }
  for (const provider of configured) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await provider.complete(request);
        return { provider: provider.name, result: parse(text) };
      } catch (e) {
        const retry = e instanceof ProviderError && e.retryable && attempt === 0;
        if (!retry) {
          errors.push(e instanceof ProviderError ? e.message : `${provider.name}: ${e.message}`);
          break;
        }
        // Respect the provider's suggested wait, capped so requests don't hang.
        await sleep(Math.min(Math.max(e.retryAfterMs || 1000, 1000), 20000));
      }
    }
  }
  const err = new Error(`All AI providers failed. ${errors.join(' | ')}`);
  err.providerErrors = errors;
  throw err;
};

module.exports = { completeWithFallback, ProviderError, PROVIDERS };
