// Chrome Web Store preparation: a deterministic checklist computed from the
// project, plus an AI-drafted "store kit" the user reviews and edits.
// Nothing here submits anything or promises approval.
const { completeWithFallback } = require('./ai/providers');
const { extractJson } = require('./ai/parse');
const { validateExtension } = require('./validator.service');
const { runStaticChecks } = require('./security/staticChecks');

const FAST_MODEL = () => process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';

const readManifest = (files) => {
  try {
    return JSON.parse(files.find((f) => f.filename === 'manifest.json')?.content || '{}');
  } catch {
    return {};
  }
};

// Heuristic: does the extension send or collect user data?
const handlesUserData = (files) =>
  files.some(
    (f) =>
      f.encoding !== 'base64' &&
      /\.m?js$/.test(f.filename) &&
      /\bfetch\s*\(|XMLHttpRequest|navigator\.sendBeacon|chrome\.(cookies|history|identity)\b/.test(f.content)
  );

const item = (id, title, status, detail, manual = false) => ({ id, title, status, detail, manual });

/** @returns {{ items: Array<{id,title,status:'pass'|'todo'|'manual',detail,manual}>, ready: boolean }} */
const buildChecklist = (files, storeAssets = {}) => {
  const m = readManifest(files);
  const { errors } = validateExtension(files);
  const findings = runStaticChecks(files);
  const kit = storeAssets.kit || {};
  const perms = [...(m.permissions || []), ...(m.host_permissions || [])];
  const justified = kit.permissionJustifications || {};
  const unjustified = perms.filter((p) => !String(justified[p] || '').trim());
  const names = new Set(files.map((f) => f.filename));
  const icon128 = m.icons?.['128'];
  const collects = handlesUserData(files);

  const items = [
    item('mv3', 'Manifest V3 with no validation errors', errors.length ? 'todo' : 'pass', errors.length ? `${errors.length} problem(s) — see the Problems tab` : 'Passes the validator'),
    item('name', 'Name is 75 characters or fewer', typeof m.name === 'string' && m.name.length <= 75 ? 'pass' : 'todo', m.name ? `“${m.name}” (${m.name.length})` : 'Missing'),
    item(
      'description',
      'Manifest description is 132 characters or fewer',
      typeof m.description === 'string' && m.description.length > 0 && m.description.length <= 132 ? 'pass' : 'todo',
      m.description ? `${m.description.length} characters` : 'Missing'
    ),
    item('icon', '128×128 icon included', icon128 && names.has(icon128) ? 'pass' : 'todo', icon128 || 'Add icons.128 to the manifest'),
    item(
      'remote-code',
      'No remotely hosted code',
      findings.some((f) => ['remote-script', 'remote-import', 'csp-remote'].includes(f.id)) ? 'todo' : 'pass',
      'Required by the MV3 policy'
    ),
    item(
      'security',
      'No critical security findings',
      findings.some((f) => f.severity === 'critical') ? 'todo' : 'pass',
      `${findings.filter((f) => f.severity === 'critical').length} critical, ${findings.length} total`
    ),
    item(
      'permissions',
      'Every permission has a justification',
      perms.length === 0 || unjustified.length === 0 ? 'pass' : 'todo',
      perms.length === 0 ? 'No permissions requested' : unjustified.length ? `Missing for: ${unjustified.join(', ')}` : `${perms.length} justified`
    ),
    item('single-purpose', 'Single-purpose description written', String(kit.singlePurpose || '').trim() ? 'pass' : 'todo', 'The store asks what the extension’s one purpose is'),
    item(
      'privacy',
      collects ? 'Privacy policy (the code sends or reads user data)' : 'Privacy policy',
      collects ? (String(kit.privacyPolicy || '').trim() ? 'pass' : 'todo') : 'pass',
      collects ? 'Needed because the code makes network requests or reads browsing data' : 'No data handling detected — still recommended'
    ),
    item('listing', 'Store description and category', String(kit.longDescription || '').trim() && kit.category ? 'pass' : 'todo', kit.category || 'Generate or write the store kit'),
    item('screenshots', 'At least one 1280×800 or 640×400 screenshot', 'manual', 'Capture from the Testing Lab or take one in Chrome', true),
    item('account', 'Chrome Web Store developer account', 'manual', 'One-time registration fee; verify your email and payment in the developer dashboard', true),
  ];
  const ready = items.every((i) => i.status !== 'todo');
  return { items, ready, collectsData: collects };
};

const KIT_SYSTEM = `You write Chrome Web Store listings for small Manifest V3 extensions.
Be accurate to the code; never invent features. Plain, friendly language. No emoji. No claims about approval or safety guarantees.
Output ONLY JSON:
{
  "shortDescription": "max 132 characters",
  "longDescription": "2-4 short paragraphs describing what it does and how to use it",
  "category": "one of: Accessibility, Art & Design, Communication, Developer Tools, Education, Entertainment, Functionality & UI, Games, Household, Just for Fun, News & Weather, Privacy & Security, Shopping, Social Networking, Tools, Travel, Well-being, Workflow & Planning",
  "singlePurpose": "one sentence",
  "permissionJustifications": { "<permission>": "why it is needed, one sentence" },
  "privacyPolicy": "Markdown privacy policy. State exactly what data is read, stored or sent based on the code, or that none is collected."
}`;

const CATEGORIES = new Set([
  'Accessibility', 'Art & Design', 'Communication', 'Developer Tools', 'Education', 'Entertainment', 'Functionality & UI', 'Games',
  'Household', 'Just for Fun', 'News & Weather', 'Privacy & Security', 'Shopping', 'Social Networking', 'Tools', 'Travel',
  'Well-being', 'Workflow & Planning',
]);

const parseKit = (perms) => (text) => {
  const j = extractJson(text);
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  if (!str(j.longDescription, 10)) throw new Error('store kit missing description');
  const just = {};
  for (const p of perms) just[p] = str(j.permissionJustifications?.[p], 300);
  return {
    shortDescription: str(j.shortDescription, 132),
    longDescription: str(j.longDescription, 4000),
    category: CATEGORIES.has(j.category) ? j.category : 'Tools',
    singlePurpose: str(j.singlePurpose, 300),
    permissionJustifications: just,
    privacyPolicy: str(j.privacyPolicy, 6000),
  };
};

const draftStoreKit = async (ext) => {
  const files = ext.files || [];
  const m = readManifest(files);
  const perms = [...(m.permissions || []), ...(m.host_permissions || [])];
  const code = files
    .filter((f) => f.encoding !== 'base64' && /\.(json|m?js|html)$/.test(f.filename))
    .map((f) => `--- ${f.filename} ---\n${f.content}`)
    .join('\n\n')
    .slice(0, 24000);
  const { result } = await completeWithFallback(
    {
      system: KIT_SYSTEM,
      user: `Extension request: ${ext.prompt}\nPermissions to justify: ${perms.join(', ') || 'none'}\nData handling detected in code: ${handlesUserData(files) ? 'yes' : 'no'}\n\nFiles:\n${code}`,
      json: true,
      maxTokens: 2000,
      timeoutMs: 45000,
      models: { Groq: FAST_MODEL() },
    },
    parseKit(perms)
  );
  return result;
};

// Validates a user-edited kit before saving.
const cleanKit = (kit, perms) => parseKit(perms)(JSON.stringify(kit || {}));

const listingMarkdown = (ext, kit) => `# ${ext.title} — Chrome Web Store listing

## Short description
${kit.shortDescription}

## Category
${kit.category}

## Description
${kit.longDescription}

## Single purpose
${kit.singlePurpose}

## Permission justifications
${Object.entries(kit.permissionJustifications || {}).map(([p, j]) => `- \`${p}\`: ${j}`).join('\n') || '- No permissions requested'}

---
Prepared with Extensio AI. Review everything before submitting. Approval is decided by the Chrome Web Store, not by this tool.
`;

module.exports = { buildChecklist, draftStoreKit, cleanKit, listingMarkdown, readManifest, handlesUserData };
