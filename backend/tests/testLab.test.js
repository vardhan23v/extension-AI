// Testing Lab API: dispatch, runner signatures, report validation, ownership.
process.env.CREW_ENABLED = 'false';
process.env.TEST_RUNNER_SECRET = 'test-secret';
process.env.GITHUB_DISPATCH_TOKEN = 'ghp_test';
process.env.TEST_RUNNER_REPO = 'owner/repo';

jest.mock('../repositories/extensions.repo');
jest.mock('../repositories/testRuns.repo');
jest.mock('../services/supabase', () => {
  const getUser = jest.fn();
  return { getSupabase: () => ({ auth: { getUser } }), __getUser: getUser };
});

const request = require('supertest');
const repo = require('../repositories/extensions.repo');
const runs = require('../repositories/testRuns.repo');
const { __getUser } = require('../services/supabase');
const { sign, cleanReport } = require('../services/testLab.service');
const { validFiles } = require('./fixtures');
const app = require('../server');

const USER = '11111111-1111-4111-8111-111111111111';
const EXT = '33333333-3333-4333-8333-333333333333';
const RUN = '44444444-4444-4444-8444-444444444444';
const auth = { Authorization: 'Bearer t' };

beforeEach(() => {
  jest.resetAllMocks();
  __getUser.mockResolvedValue({ data: { user: { id: USER, email: 'a@x.test', user_metadata: {} } }, error: null });
  repo.findOwned.mockResolvedValue({ id: EXT, user_id: USER, files: validFiles() });
  runs.countRecent.mockResolvedValue(0);
  runs.create.mockImplementation(async (row) => ({ id: RUN, extension_id: row.extension_id, status: 'queued', created_at: new Date().toISOString() }));
  runs.update.mockImplementation(async (id, patch) => ({ id, ...patch }));
  global.fetch = jest.fn().mockResolvedValue({ status: 204, text: async () => '' });
});

describe('starting a run', () => {
  test('snapshots the files, dispatches to GitHub and returns 202', async () => {
    const r = await request(app).post(`/api/extensions/${EXT}/test`).set(auth);
    expect(r.status).toBe(202);
    expect(runs.create).toHaveBeenCalledWith({ extension_id: EXT, user_id: USER, files_snapshot: validFiles() });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('https://api.github.com/repos/owner/repo/dispatches');
    expect(JSON.parse(opts.body)).toEqual({ event_type: 'test-extension', client_payload: { runId: RUN } });
  });

  test('dispatch failure marks the run as error and returns 502', async () => {
    global.fetch.mockResolvedValue({ status: 404, text: async () => 'Not Found' });
    const r = await request(app).post(`/api/extensions/${EXT}/test`).set(auth);
    expect(r.status).toBe(502);
    expect(runs.update).toHaveBeenCalledWith(RUN, expect.objectContaining({ status: 'error' }));
  });

  test('hourly limit', async () => {
    runs.countRecent.mockResolvedValue(10);
    expect((await request(app).post(`/api/extensions/${EXT}/test`).set(auth)).status).toBe(429);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('owner only, and 503 when not configured', async () => {
    repo.findOwned.mockResolvedValue(null);
    expect((await request(app).post(`/api/extensions/${EXT}/test`).set(auth)).status).toBe(404);
    const saved = process.env.GITHUB_DISPATCH_TOKEN;
    delete process.env.GITHUB_DISPATCH_TOKEN;
    expect((await request(app).post(`/api/extensions/${EXT}/test`).set(auth)).status).toBe(503);
    process.env.GITHUB_DISPATCH_TOKEN = saved;
  });
});

describe('runner endpoints', () => {
  const sig = (purpose, runId = RUN) => ({ 'X-Runner-Signature': `sha256=${sign(runId, purpose)}` });
  beforeEach(() => runs.findForRunner.mockResolvedValue({ id: RUN, status: 'queued', files_snapshot: validFiles() }));

  test('bundle requires a valid signature for that run and purpose', async () => {
    expect((await request(app).get(`/api/test-runs/${RUN}/bundle`)).status).toBe(401);
    expect((await request(app).get(`/api/test-runs/${RUN}/bundle`).set(sig('result'))).status).toBe(401);
    expect((await request(app).get(`/api/test-runs/${RUN}/bundle`).set(sig('bundle', '55555555-5555-4555-8555-555555555555'))).status).toBe(401);
    const r = await request(app).get(`/api/test-runs/${RUN}/bundle`).set(sig('bundle'));
    expect(r.status).toBe(200);
    expect(r.body.files).toHaveLength(validFiles().length);
    expect(runs.update).toHaveBeenCalledWith(RUN, expect.objectContaining({ status: 'running' }));
  });

  test('result: a failing check marks the run failed', async () => {
    const report = { checks: [{ id: 'popup', title: 'Popup', status: 'fail', detail: 'TypeError' }], consoleErrors: [{ source: 'popup.html', message: 'TypeError' }] };
    const r = await request(app).post(`/api/test-runs/${RUN}/result`).set(sig('result')).send(report);
    expect(r.body.status).toBe('failed');
    expect(runs.update).toHaveBeenCalledWith(RUN, expect.objectContaining({ status: 'failed', report: expect.objectContaining({ checks: expect.any(Array) }) }));
  });

  test('result: runner error is stored as error', async () => {
    const r = await request(app).post(`/api/test-runs/${RUN}/result`).set(sig('result')).send({ error: 'Chromium crashed' });
    expect(r.body.status).toBe('error');
  });

  test('finished runs cannot be overwritten', async () => {
    runs.findForRunner.mockResolvedValue({ id: RUN, status: 'passed' });
    expect((await request(app).post(`/api/test-runs/${RUN}/result`).set(sig('result')).send({ checks: [] })).status).toBe(404);
  });

  test('invalid report shape is 400', async () => {
    expect((await request(app).post(`/api/test-runs/${RUN}/result`).set(sig('result')).send({ nope: true })).status).toBe(400);
  });
});

describe('cleanReport', () => {
  test('drops oversized or non-base64 screenshots and normalises statuses', () => {
    const r = cleanReport({
      checks: [{ id: 'x', title: 'X', status: 'bogus' }],
      screenshots: [{ name: 'ok', data: 'QUJD' }, { name: 'bad', data: '<script>' }, { name: 'huge', data: 'A'.repeat(1_500_000) }],
    });
    expect(r.checks[0].status).toBe('warn');
    expect(r.screenshots.map((s) => s.name)).toEqual(['ok']);
  });
});

describe('listing', () => {
  test('stale queued runs are reported as errors', async () => {
    runs.listForExtension.mockResolvedValue([{ id: RUN, extension_id: EXT, status: 'queued', created_at: new Date(Date.now() - 20 * 60000).toISOString() }]);
    const r = await request(app).get(`/api/extensions/${EXT}/test-runs`).set(auth);
    expect(r.body.runs[0]).toMatchObject({ status: 'error', stale: true });
  });

  test('a run belonging to someone else is 404', async () => {
    runs.findOwned.mockResolvedValue(null);
    expect((await request(app).get(`/api/test-runs/${RUN}`).set(auth)).status).toBe(404);
  });
});
