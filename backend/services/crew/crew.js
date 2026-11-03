// Sequential crew: Planner → Engineer → QA Reviewer → Security Analyst.
// Shares one context, reports progress through onEvent, and stays inside a
// time budget so it fits the serverless function limit.
const { planner, engineer, qa, security } = require('./agents');
const { generateExtension, editExtension } = require('../generation.service');

const DEFAULT_BUDGET_MS = Number(process.env.CREW_BUDGET_MS) || 50000;
const isEnabled = () => process.env.CREW_ENABLED !== 'false';

const AGENTS = { create: [planner, engineer, qa, security], edit: [planner, engineer, qa, security], debug: [engineer, qa, security] };

const runCrew = async ({ kind = 'create', prompt, options = {}, extension, instruction, history = [], onEvent = () => {}, budgetMs = DEFAULT_BUDGET_MS }) => {
  const started = Date.now();
  const ctx = {
    kind, prompt, options, extension, instruction, history,
    plan: null, result: null, securityFindings: [],
    hasTime: (ms) => Date.now() - started + ms < budgetMs,
  };
  const trace = [];

  if (!isEnabled()) {
    ctx.result = kind === 'create' ? await generateExtension(prompt, options) : await editExtension(extension, instruction, { kind, history });
    return { result: ctx.result, plan: null, trace, securityFindings: [] };
  }

  for (const agent of AGENTS[kind]) {
    if (agent.optional && !ctx.hasTime(35000)) {
      trace.push({ agent: agent.id, role: agent.role, status: 'skipped', ms: 0, summary: 'Skipped to stay within the time limit' });
      onEvent({ type: 'agent:done', ...trace[trace.length - 1] });
      continue;
    }
    const t0 = Date.now();
    onEvent({ type: 'agent:start', agent: agent.id, role: agent.role, goal: agent.goal });
    try {
      const summary = await agent.run(ctx);
      trace.push({ agent: agent.id, role: agent.role, status: 'done', ms: Date.now() - t0, summary });
      onEvent({ type: 'agent:done', ...trace[trace.length - 1], ...(agent.id === 'planner' ? { plan: ctx.plan } : {}) });
    } catch (err) {
      // Optional agents (the planner) fall back silently; the crew continues without them.
      if (agent.optional) {
        trace.push({ agent: agent.id, role: agent.role, status: 'skipped', ms: Date.now() - t0, summary: 'Planner unavailable; continued without a plan' });
        onEvent({ type: 'agent:done', ...trace[trace.length - 1] });
        continue;
      }
      // Reviewers failing must not hide a valid result.
      if (ctx.result && agent.id !== 'engineer') {
        trace.push({ agent: agent.id, role: agent.role, status: 'failed', ms: Date.now() - t0, summary: 'Review step failed; result kept as is' });
        onEvent({ type: 'agent:done', ...trace[trace.length - 1] });
        continue;
      }
      onEvent({ type: 'agent:done', agent: agent.id, role: agent.role, status: 'failed', ms: Date.now() - t0, summary: err.message });
      throw err;
    }
  }

  return { result: ctx.result, plan: ctx.plan, trace, securityFindings: ctx.securityFindings, ms: Date.now() - started };
};

module.exports = { runCrew, isEnabled };
