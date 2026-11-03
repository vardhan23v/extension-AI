const { runStaticChecks } = require('./staticChecks');
const { completeWithFallback } = require('../ai/providers');
const { extractJson } = require('../ai/parse');

const AI_SYSTEM = `You are a Chrome extension security reviewer. You receive extension files and a list of findings from deterministic checks.
Explain the most important risks in plain language for a beginner and point out anything the checks may have missed.
Output ONLY JSON: { "summary": "2-4 sentences", "additionalConcerns": ["..."] }. Do not claim the extension is safe or certified.`;

/**
 * Security audit with explicit status. AI is only used for explanation; its
 * failure makes the audit "incomplete" — it can never make an extension look safe.
 *   passed     — static checks ran and found nothing, AI review completed
 *   findings   — static checks found issues
 *   incomplete — static checks ran but the AI review could not be completed
 *   failed     — the static checks themselves could not run
 */
const auditExtension = async (files, { withAi = true } = {}) => {
  let findings;
  try {
    findings = runStaticChecks(files);
  } catch (e) {
    console.error('Static security checks failed:', e.message);
    return { status: 'failed', findings: [], checks: { static: 'failed', ai: 'skipped' }, message: 'The security audit could not run. Do not treat this extension as reviewed.' };
  }

  let ai = { status: 'skipped' };
  if (withAi) {
    const code = files
      .filter((f) => f.encoding !== 'base64' && /\.(json|m?js|html)$/.test(f.filename))
      .map((f) => `--- ${f.filename} ---\n${f.content}`)
      .join('\n\n')
      .slice(0, 60000);
    try {
      const { result } = await completeWithFallback(
        {
          system: AI_SYSTEM,
          user: `Findings:\n${JSON.stringify(findings.map(({ id, severity, file, message }) => ({ id, severity, file, message })))}\n\nFiles:\n${code}`,
          json: true,
          maxTokens: 1500,
          timeoutMs: 45000,
        },
        (t) => {
          const j = extractJson(t);
          if (typeof j.summary !== 'string') throw new Error('missing summary');
          return {
            summary: j.summary.slice(0, 2000),
            additionalConcerns: Array.isArray(j.additionalConcerns) ? j.additionalConcerns.filter((s) => typeof s === 'string').slice(0, 10) : [],
          };
        }
      );
      ai = { status: 'completed', ...result };
    } catch (e) {
      console.error('AI security review failed:', e.message);
      ai = { status: 'failed' };
    }
  }

  let status;
  if (findings.length > 0) status = 'findings';
  else if (ai.status === 'completed') status = 'passed';
  else status = 'incomplete';

  const counts = findings.reduce((acc, f) => ({ ...acc, [f.severity]: (acc[f.severity] || 0) + 1 }), {});
  return {
    status,
    findings,
    counts,
    checks: { static: 'completed', ai: ai.status },
    aiSummary: ai.status === 'completed' ? ai.summary : null,
    aiConcerns: ai.status === 'completed' ? ai.additionalConcerns : [],
    disclaimer: 'Automated checks only. This is not a security certification and does not guarantee Chrome Web Store approval.',
  };
};

module.exports = { auditExtension };
