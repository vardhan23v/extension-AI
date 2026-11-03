const { completeWithFallback } = require('./ai/providers');
const { parseExtensionResponse } = require('./ai/parse');
const { sanitizeFiles } = require('../utils/sanitize');
const { injectMissingIcons } = require('./icons.service');
const { validateExtension } = require('./validator.service');

class GenerationError extends Error {
  constructor(message, { status = 422, details } = {}) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const BASE_RULES = `You are an expert Chrome Extension developer producing Manifest V3 extensions.

OUTPUT FORMAT — output ONLY one JSON object, no markdown, no commentary:
{
  "title": "Short extension name",
  "storeDescription": "Engaging 2-3 sentence Chrome Web Store description.",
  "summary": "One or two sentences describing what you built or changed.",
  "files": [ { "filename": "manifest.json", "content": "..." }, ... ]
}

RULES:
1. manifest.json: "manifest_version": 3, a "name", a "version" like "1.0.0", and a short "description".
2. Include this exact icon configuration — the platform generates the PNG files, do NOT output them:
   "icons": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" },
   "action": { "default_icon": { "16": "icon16.png", "48": "icon48.png", "128": "icon128.png" } }
3. Use a background "service_worker" (never "background.scripts"), "action" (never "browser_action"), and put URL patterns in "host_permissions", not "permissions".
4. Request only the permissions the code actually uses. Prefer "activeTab" over broad host access.
5. NO remote code: no <script src="https://...">, no CDNs (no Tailwind CDN), no eval/new Function. All JS must be in packaged .js files.
6. NO inline <script> blocks and NO inline event handlers (onclick=...). Use addEventListener in .js files.
7. Every file referenced by the manifest or by HTML must be included. Do not include unused files.
8. Write a popup.css with clean, modern styling and link it from popup.html.
9. Use textContent instead of innerHTML for untrusted data.
10. File content must be complete and working — no placeholders or TODOs.`;

const buildSystemPrompt = ({ monetizationLink, webhookUrl, languages } = {}) => {
  let prompt = BASE_RULES;
  if (monetizationLink) {
    prompt += `\n11. Add a small "Support" link at the bottom of the popup pointing to the URL given in the user message as MONETIZATION_URL (target="_blank", rel="noopener").`;
  }
  if (webhookUrl) {
    prompt += `\n12. Send relevant data with fetch() to the URL given in the user message as WEBHOOK_URL, add that origin to "host_permissions", and tell the user in the popup that data is sent there.`;
  }
  if (languages?.length) {
    prompt += `\n13. i18n: generate _locales/<code>/messages.json for: ${languages.join(', ')}, set "default_locale": "en", and use chrome.i18n.getMessage.`;
  }
  return prompt;
};

const userOptionsBlock = ({ monetizationLink, webhookUrl } = {}) =>
  [monetizationLink && `MONETIZATION_URL: ${monetizationLink}`, webhookUrl && `WEBHOOK_URL: ${webhookUrl}`]
    .filter(Boolean)
    .join('\n');

const filesAsContext = (files) =>
  files
    .filter((f) => f.encoding !== 'base64')
    .map((f) => `--- FILE: ${f.filename} ---\n${f.content}`)
    .join('\n\n');

// parse → sanitize → add icons → validate. Throws on any failure so the
// provider layer can fall through, except validation which returns results.
const processResponse = (text, seed) => {
  const parsed = parseExtensionResponse(text);
  const files = injectMissingIcons(sanitizeFiles(parsed.files), seed || parsed.title);
  const validation = validateExtension(files);
  return { ...parsed, files, validation };
};

const runWithRepair = async ({ system, user, seed }) => {
  let first;
  try {
    first = await completeWithFallback({ system, user, json: true }, (t) => processResponse(t, seed));
  } catch (e) {
    throw new GenerationError(e.message, { status: 502 });
  }
  let out = first.result;
  let provider = first.provider;
  let repaired = false;

  // At most one automatic repair attempt to avoid loops.
  if (out.validation.errors.length > 0) {
    const repairUser = `${user}\n\nYour previous output had these validation errors:\n- ${out.validation.errors.join(
      '\n- '
    )}\n\nPrevious files:\n${filesAsContext(out.files)}\n\nReturn the complete corrected file set in the same JSON format.`;
    try {
      const second = await completeWithFallback({ system, user: repairUser, json: true }, (t) => processResponse(t, seed));
      if (second.result.validation.errors.length < out.validation.errors.length) {
        out = second.result;
        provider = second.provider;
        repaired = true;
      }
    } catch {
      // keep first result; errors reported below
    }
  }

  if (out.validation.errors.length > 0) {
    throw new GenerationError('The generated extension did not pass validation. Try rephrasing your request.', {
      details: { errors: out.validation.errors, warnings: out.validation.warnings },
    });
  }
  return { ...out, provider, repaired };
};

const generateExtension = (prompt, options = {}) =>
  runWithRepair({
    system: buildSystemPrompt(options),
    user: [`Build this Chrome extension:\n${prompt}`, userOptionsBlock(options)].filter(Boolean).join('\n\n'),
  });

// Edits an existing project: the current files are sent so unrelated code is preserved.
const editExtension = (extension, instruction, { kind = 'edit' } = {}) => {
  const task =
    kind === 'debug'
      ? `The extension below throws this error:\n${instruction}\n\nFix the cause. Change only what is needed.`
      : `Apply this change to the extension below:\n${instruction}\n\nChange only what is needed and keep all unrelated code and files as they are.`;
  return runWithRepair({
    system: buildSystemPrompt({ monetizationLink: extension.monetization_link }),
    user: [
      `Original request: ${extension.prompt}`,
      task,
      userOptionsBlock({ monetizationLink: extension.monetization_link }),
      `Return the COMPLETE updated file set (all files, including unchanged ones).`,
      `Current files:\n${filesAsContext(extension.files)}`,
    ]
      .filter(Boolean)
      .join('\n\n'),
    seed: extension.title,
  });
};

const ENHANCE_SYSTEM = `You are an expert Chrome Extension product designer. Expand the user's brief idea into a detailed prompt.
Keep the user's intent. Add specific popup UI, functionality (APIs, storage, minimal permissions) and UX details (loading, errors).
8-12 bullet points maximum. Output ONLY the enhanced prompt text, no explanation, no markdown fences, no quotes.`;

const enhancePrompt = async (prompt) => {
  const { result } = await completeWithFallback(
    { system: ENHANCE_SYSTEM, user: `Enhance this Chrome extension prompt:\n${prompt}`, maxTokens: 1000, timeoutMs: 30000 },
    (t) => {
      const cleaned = t.trim().replace(/^["']|["']$/g, '').trim();
      if (!cleaned) throw new Error('empty');
      return cleaned;
    }
  );
  return result;
};

module.exports = { generateExtension, editExtension, enhancePrompt, GenerationError, buildSystemPrompt };
