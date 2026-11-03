// Crew roles. Each agent has a role, a goal and a run() that receives the
// shared context. LLM agents are kept small to respect provider rate limits;
// reviewers are deterministic and only call the engineer when they find problems.
const { completeWithFallback } = require('../ai/providers');
const { extractJson } = require('../ai/parse');
const { generateExtension, editExtension, fixFiles } = require('../generation.service');
const { validateExtension } = require('../validator.service');
const { runStaticChecks } = require('../security/staticChecks');

const FAST_MODEL = () => process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b';
const strList = (v, max = 12) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => x.slice(0, 200)).slice(0, max) : []);

const PLANNER_SYSTEM = `You are the Product Planner in a team that builds Manifest V3 Chrome extensions.
Goal: turn the request into a short, concrete implementation plan with the LEAST permissions possible.
Output ONLY JSON:
{
  "name": "Short extension name",
  "summary": "One sentence",
  "features": ["user-visible behaviour", "..."],
  "files": ["manifest.json", "popup.html", "..."],
  "permissions": ["storage", "..."],
  "hostPermissions": [],
  "risks": ["anything that needs care, e.g. broad site access"]
}
Rules: prefer "activeTab" over host permissions; never plan remote code; list only files that are needed; do not list icon files.`;

const parsePlan = (text) => {
  const j = extractJson(text);
  if (typeof j.summary !== 'string' || !Array.isArray(j.files)) throw new Error('plan missing summary or files');
  return {
    name: typeof j.name === 'string' ? j.name.slice(0, 80) : undefined,
    summary: j.summary.slice(0, 300),
    features: strList(j.features),
    files: strList(j.files, 30),
    permissions: strList(j.permissions, 20),
    hostPermissions: strList(j.hostPermissions, 20),
    risks: strList(j.risks, 8),
  };
};

const planner = {
  id: 'planner',
  role: 'Product Planner',
  goal: 'Turn the request into a least-privilege implementation plan',
  optional: true,
  async run(ctx) {
    const task =
      ctx.kind === 'create'
        ? `Plan this Chrome extension:\n${ctx.prompt}`
        : `Plan this change to an existing extension.\nOriginal request: ${ctx.extension.prompt}\nRequested change: ${ctx.instruction}\nExisting files: ${ctx.extension.files.map((f) => f.filename).join(', ')}`;
    const { result } = await completeWithFallback(
      { system: PLANNER_SYSTEM, user: task, json: true, maxTokens: 900, timeoutMs: 20000, models: { Groq: FAST_MODEL() } },
      parsePlan
    );
    ctx.plan = result;
    return `${result.files.length} files, permissions: ${result.permissions.join(', ') || 'none'}`;
  },
};

const engineer = {
  id: 'engineer',
  role: 'Extension Engineer',
  goal: 'Write a complete, valid Manifest V3 project that follows the plan',
  async run(ctx) {
    ctx.result =
      ctx.kind === 'create'
        ? await generateExtension(ctx.prompt, { ...ctx.options, plan: ctx.plan })
        : await editExtension(ctx.extension, ctx.instruction, { kind: ctx.kind, history: ctx.history, plan: ctx.plan });
    return `${ctx.result.files.length} files${ctx.result.repaired ? ' (self-repaired once)' : ''}`;
  },
};

// Applies one engineer fix and keeps it only if it is not worse.
const applyFix = async (ctx, issues, isBetter) => {
  const fixed = await fixFiles({
    prompt: ctx.kind === 'create' ? ctx.prompt : `${ctx.extension.prompt}\nChange: ${ctx.instruction}`,
    files: ctx.result.files,
    issues,
    options: ctx.options,
    seed: ctx.result.title,
  });
  if (isBetter(fixed)) {
    ctx.result = { ...ctx.result, files: fixed.files, validation: fixed.validation, fixedBy: [...(ctx.result.fixedBy || []), 'review'] };
    return true;
  }
  return false;
};

const qa = {
  id: 'qa',
  role: 'QA Reviewer',
  goal: 'Check the project against Manifest V3 rules and the plan',
  async run(ctx) {
    const names = new Set(ctx.result.files.map((f) => f.filename));
    const missing = ctx.kind === 'create' && ctx.plan ? ctx.plan.files.filter((f) => !/\.(png|ico)$/i.test(f) && !names.has(f)) : [];
    const { errors } = validateExtension(ctx.result.files);
    const issues = [...errors, ...missing.map((f) => `Planned file "${f}" is missing`)];
    if (!issues.length) return 'All checks passed';
    if (!ctx.hasTime(15000)) return `${issues.length} issue(s) found; no time left to fix`;
    const missingAfter = (r) => {
      const n = new Set(r.files.map((f) => f.filename));
      return missing.filter((f) => !n.has(f)).length;
    };
    // Keep the fix only if nothing got worse and something improved.
    const fixed = await applyFix(
      ctx,
      issues,
      (r) => r.validation.errors.length <= errors.length && missingAfter(r) <= missing.length && r.validation.errors.length + missingAfter(r) < issues.length
    );
    return fixed ? `Fixed ${issues.length} issue(s)` : `${issues.length} issue(s) could not be fixed automatically`;
  },
};

const security = {
  id: 'security',
  role: 'Security Analyst',
  goal: 'Find dangerous patterns and get critical ones fixed',
  async run(ctx) {
    const findings = runStaticChecks(ctx.result.files);
    ctx.securityFindings = findings;
    const critical = findings.filter((f) => f.severity === 'critical');
    if (!critical.length) return findings.length ? `${findings.length} non-critical finding(s) to review` : 'No findings';
    if (!ctx.hasTime(15000)) return `${critical.length} critical finding(s); no time left to fix`;
    const issues = critical.map((f) => `${f.file || 'project'}: ${f.message}. ${f.recommendation || ''}`.trim());
    const fixed = await applyFix(ctx, issues, (r) => {
      const after = runStaticChecks(r.files).filter((f) => f.severity === 'critical').length;
      return after < critical.length && r.validation.errors.length === 0;
    });
    if (fixed) ctx.securityFindings = runStaticChecks(ctx.result.files);
    return fixed ? `Fixed ${critical.length} critical finding(s)` : `${critical.length} critical finding(s) remain`;
  },
};

module.exports = { planner, engineer, qa, security, parsePlan };
