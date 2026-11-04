const repo = require('../repositories/extensions.repo');
const runs = require('../repositories/testRuns.repo');
const lab = require('../services/testLab.service');
const { UUID_RE } = require('../middleware/validate.middleware');

const RUNS_PER_HOUR = Number(process.env.TEST_RUNS_PER_HOUR) || 10;
const STALE_MS = 15 * 60 * 1000;

// Queued/running runs that never reported back are shown as errors.
const present = (run) => {
  const age = Date.now() - new Date(run.started_at || run.created_at).getTime();
  const stale = (run.status === 'queued' || run.status === 'running') && age > STALE_MS;
  return {
    id: run.id,
    extensionId: run.extension_id,
    title: run.extensions?.title,
    status: stale ? 'error' : run.status,
    stale,
    createdAt: run.created_at,
    startedAt: run.started_at,
    finishedAt: run.finished_at,
    ...(run.report !== undefined ? { report: run.report } : {}),
  };
};

// ---- User-facing ---------------------------------------------------------

const startRun = async (req, res, next) => {
  try {
    if (!lab.isConfigured()) return res.status(503).json({ message: 'The Testing Lab is not set up on this server yet.' });
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const recent = await runs.countRecent(req.user.userId, new Date(Date.now() - 3600_000).toISOString());
    if (recent >= RUNS_PER_HOUR) return res.status(429).json({ message: `You can start ${RUNS_PER_HOUR} test runs per hour. Try again later.` });

    const run = await runs.create({ extension_id: ext.id, user_id: req.user.userId, files_snapshot: ext.files });
    try {
      await lab.dispatch(run.id);
    } catch (err) {
      console.error('Test dispatch failed:', err.message, err.detail || '');
      await runs.update(run.id, { status: 'error', finished_at: new Date().toISOString(), report: { checks: [], error: 'The test runner could not be started.' } });
      return res.status(502).json({ message: 'The test runner could not be started. Please try again later.' });
    }
    res.status(202).json({ success: true, run: present(run) });
  } catch (err) {
    next(err);
  }
};

const listForExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    res.json({ success: true, configured: lab.isConfigured(), runs: (await runs.listForExtension(ext.id, req.user.userId)).map(present) });
  } catch (err) {
    next(err);
  }
};

const listMine = async (req, res, next) => {
  try {
    res.json({ success: true, configured: lab.isConfigured(), runs: (await runs.listForUser(req.user.userId)).map(present) });
  } catch (err) {
    next(err);
  }
};

const getRun = async (req, res, next) => {
  try {
    const run = await runs.findOwned(req.params.runId, req.user.userId);
    if (!run) return res.status(404).json({ message: 'Test run not found' });
    res.json({ success: true, run: present(run) });
  } catch (err) {
    next(err);
  }
};

// ---- Runner-facing (HMAC-signed, no user session) -------------------------

const runnerAuth = (purpose) => (req, res, next) => {
  if (!UUID_RE.test(req.params.runId) || !lab.verify(req.params.runId, purpose, req.get('X-Runner-Signature'))) {
    return res.status(401).json({ message: 'Invalid runner signature' });
  }
  next();
};

const runnerBundle = async (req, res, next) => {
  try {
    const run = await runs.findForRunner(req.params.runId);
    if (!run || !['queued', 'running'].includes(run.status)) return res.status(404).json({ message: 'Run not found or already finished' });
    await runs.update(run.id, { status: 'running', started_at: new Date().toISOString() });
    res.json({ runId: run.id, files: run.files_snapshot });
  } catch (err) {
    next(err);
  }
};

const runnerResult = async (req, res, next) => {
  try {
    const run = await runs.findForRunner(req.params.runId);
    if (!run || !['queued', 'running'].includes(run.status)) return res.status(404).json({ message: 'Run not found or already finished' });
    let report;
    let status;
    if (req.body?.error) {
      report = { checks: [], error: String(req.body.error).slice(0, 500) };
      status = 'error';
    } else {
      report = lab.cleanReport(req.body);
      status = lab.statusFromReport(report);
    }
    await runs.update(run.id, { status, report, finished_at: new Date().toISOString() });
    res.json({ success: true, status });
  } catch (err) {
    next(err);
  }
};

module.exports = { startRun, listForExtension, listMine, getRun, runnerAuth, runnerBundle, runnerResult };
