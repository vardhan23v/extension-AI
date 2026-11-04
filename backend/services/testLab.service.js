// Testing Lab: dispatches runs to the GitHub Actions runner and validates the
// signed reports it sends back. The runner never receives user credentials;
// it authenticates with an HMAC derived from TEST_RUNNER_SECRET and the run id.
const crypto = require('crypto');

const isConfigured = () => Boolean(process.env.TEST_RUNNER_SECRET && process.env.GITHUB_DISPATCH_TOKEN && process.env.TEST_RUNNER_REPO);

const sign = (runId, purpose) => crypto.createHmac('sha256', process.env.TEST_RUNNER_SECRET || '').update(`${purpose}:${runId}`).digest('hex');

const verify = (runId, purpose, signature) => {
  if (!process.env.TEST_RUNNER_SECRET || typeof signature !== 'string') return false;
  const expected = Buffer.from(sign(runId, purpose), 'hex');
  const given = Buffer.from(signature.replace(/^sha256=/, ''), 'hex');
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
};

const dispatch = async (runId) => {
  const res = await fetch(`https://api.github.com/repos/${process.env.TEST_RUNNER_REPO}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_DISPATCH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ event_type: 'test-extension', client_payload: { runId } }),
  });
  if (res.status !== 204) {
    const body = await res.text().catch(() => '');
    throw Object.assign(new Error(`Could not start the test runner (GitHub HTTP ${res.status})`), { status: 502, detail: body.slice(0, 200) });
  }
};

const CHECK_STATUSES = new Set(['pass', 'fail', 'skip', 'warn']);
const MAX_SCREENSHOT_BASE64 = 1_400_000; // ~1 MB PNG

// Validates and trims a runner report before it is stored.
const cleanReport = (r) => {
  if (!r || typeof r !== 'object' || !Array.isArray(r.checks)) throw Object.assign(new Error('Invalid report'), { status: 400 });
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const checks = r.checks.slice(0, 30).map((c) => ({
    id: str(c?.id, 40),
    title: str(c?.title, 120),
    status: CHECK_STATUSES.has(c?.status) ? c.status : 'warn',
    detail: str(c?.detail, 1000),
  }));
  const shots = Array.isArray(r.screenshots) ? r.screenshots : [];
  return {
    checks,
    consoleErrors: (Array.isArray(r.consoleErrors) ? r.consoleErrors : []).slice(0, 30).map((e) => ({ source: str(e?.source, 40), message: str(e?.message, 500) })),
    blockedRequests: (Array.isArray(r.blockedRequests) ? r.blockedRequests : []).slice(0, 20).map((u) => str(u, 200)),
    screenshots: shots
      .filter((s) => typeof s?.data === 'string' && s.data.length <= MAX_SCREENSHOT_BASE64 && /^[A-Za-z0-9+/=]+$/.test(s.data))
      .slice(0, 3)
      .map((s) => ({ name: str(s.name, 40), data: s.data })),
    chromium: str(r.chromium, 40),
    durationMs: Number.isFinite(r.durationMs) ? Math.round(r.durationMs) : null,
    notTested: (Array.isArray(r.notTested) ? r.notTested : []).slice(0, 10).map((s) => str(s, 200)),
  };
};

const statusFromReport = (report) => (report.checks.some((c) => c.status === 'fail') ? 'failed' : 'passed');

module.exports = { isConfigured, sign, verify, dispatch, cleanReport, statusFromReport };
