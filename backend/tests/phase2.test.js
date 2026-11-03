process.env.CREW_ENABLED = 'false'; // these suites test routes; the crew has its own tests
// Phase 2 routes: file saving, preview/apply, metadata, duplicate, messages, search.
jest.mock('../repositories/extensions.repo');
jest.mock('../repositories/messages.repo');
jest.mock('../services/supabase', () => {
  const getUser = jest.fn();
  return { getSupabase: () => ({ auth: { getUser } }), __getUser: getUser };
});
jest.mock('../services/ai/providers', () => {
  const actual = jest.requireActual('../services/ai/providers');
  return { ...actual, completeWithFallback: jest.fn() };
});

const request = require('supertest');
const repo = require('../repositories/extensions.repo');
const messages = require('../repositories/messages.repo');
const { __getUser } = require('../services/supabase');
const { completeWithFallback } = require('../services/ai/providers');
const { injectMissingIcons } = require('../services/icons.service');
const { aiJson, validFiles } = require('./fixtures');
const app = require('../server');

const ALICE = '11111111-1111-4111-8111-111111111111';
const EXT = '33333333-3333-4333-8333-333333333333';
const auth = { Authorization: `Bearer token-${ALICE}` };
const files = () => injectMissingIcons(validFiles(), 'x');
const ext = (extra = {}) => ({ id: EXT, user_id: ALICE, title: 'Red Page', prompt: 'p', files: files(), iteration_history: [], status: 'draft', ...extra });

beforeEach(() => {
  jest.resetAllMocks();
  __getUser.mockImplementation(async (token) =>
    token === `token-${ALICE}` ? { data: { user: { id: ALICE, email: 'a@x.test', user_metadata: {} } }, error: null } : { data: { user: null }, error: new Error('x') }
  );
  repo.findOwned.mockResolvedValue(ext());
  repo.updateOwned.mockImplementation(async (id, u, patch) => ({ ...ext(), ...patch }));
  repo.listVersions.mockResolvedValue([]);
  messages.list.mockResolvedValue([]);
  messages.add.mockResolvedValue([]);
});

describe('PUT /:id/files', () => {
  test('saves edited files, snapshots once, reports changes', async () => {
    const edited = files().map((f) => (f.filename === 'popup.css' ? { ...f, content: 'body{color:red}' } : f));
    const r = await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: edited });
    expect(r.status).toBe(200);
    expect(r.body.changes.changed).toEqual(['popup.css']);
    expect(repo.addVersion).toHaveBeenCalledTimes(1);
    expect(repo.updateOwned).toHaveBeenCalledWith(EXT, ALICE, { files: expect.any(Array) });
  });

  test('skips snapshot when one was taken recently', async () => {
    repo.listVersions.mockResolvedValue([{ id: 'v', created_at: new Date().toISOString() }]);
    const edited = files().map((f) => (f.filename === 'popup.css' ? { ...f, content: 'x{}' } : f));
    await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: edited });
    expect(repo.addVersion).not.toHaveBeenCalled();
  });

  test('saves invalid work-in-progress but reports validation errors', async () => {
    const edited = files().map((f) => (f.filename === 'popup.js' ? { ...f, content: 'let = ;' } : f));
    const r = await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: edited });
    expect(r.status).toBe(200);
    expect(r.body.validation.errors.join()).toMatch(/syntax error/);
  });

  test('rejects malicious filenames', async () => {
    const r = await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: [...files(), { filename: '../x.js', content: '' }] });
    expect(r.status).toBe(400);
    expect(repo.updateOwned).not.toHaveBeenCalled();
  });

  test('no-op save does not write', async () => {
    const r = await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: files() });
    expect(r.status).toBe(200);
    expect(repo.updateOwned).not.toHaveBeenCalled();
  });

  test('other users get 404', async () => {
    repo.findOwned.mockResolvedValue(null);
    expect((await request(app).put(`/api/extensions/${EXT}/files`).set(auth).send({ files: files() })).status).toBe(404);
  });
});

describe('preview and apply', () => {
  const dark = () => validFiles().map((f) => (f.filename === 'popup.css' ? { ...f, content: 'body{background:#000}' } : f));

  test('preview returns a proposal and saves nothing', async () => {
    completeWithFallback.mockImplementationOnce(async (req, parse) => ({ provider: 'M', result: parse(aiJson(dark())) }));
    const r = await request(app).post(`/api/extensions/iterate/${EXT}`).set(auth).send({ prompt: 'dark mode', preview: true });
    expect(r.status).toBe(200);
    expect(r.body.changes.changed).toEqual(['popup.css']);
    expect(r.body.proposal.files.length).toBeGreaterThan(0);
    expect(repo.updateOwned).not.toHaveBeenCalled();
    expect(repo.addVersion).not.toHaveBeenCalled();
  });

  test('conversation history is sent to the AI', async () => {
    messages.list.mockResolvedValue([{ role: 'user', content: 'make it blue earlier' }]);
    completeWithFallback.mockImplementationOnce(async (req, parse) => ({ provider: 'M', result: parse(aiJson(dark())) }));
    await request(app).post(`/api/extensions/iterate/${EXT}`).set(auth).send({ prompt: 'dark mode', preview: true });
    expect(completeWithFallback.mock.calls[0][0].user).toMatch(/make it blue earlier/);
  });

  test('apply re-validates, snapshots, saves and logs messages', async () => {
    const r = await request(app)
      .post(`/api/extensions/${EXT}/apply`)
      .set(auth)
      .send({ files: injectMissingIcons(dark(), 'x'), instruction: 'dark mode', summary: 'Made it dark' });
    expect(r.status).toBe(200);
    expect(repo.addVersion).toHaveBeenCalled();
    expect(messages.add).toHaveBeenCalledWith(EXT, [
      { role: 'user', content: 'dark mode' },
      expect.objectContaining({ role: 'assistant', content: 'Made it dark' }),
    ]);
  });

  test('apply rejects proposals that fail validation', async () => {
    const bad = validFiles({ manifest_version: 2 });
    const r = await request(app).post(`/api/extensions/${EXT}/apply`).set(auth).send({ files: bad, instruction: 'x' });
    expect(r.status).toBe(422);
    expect(repo.updateOwned).not.toHaveBeenCalled();
  });

  test('message logging failure does not fail the edit', async () => {
    messages.add.mockRejectedValue(new Error('db down'));
    const r = await request(app).post(`/api/extensions/${EXT}/apply`).set(auth).send({ files: files(), instruction: 'x' });
    expect(r.status).toBe(200);
  });
});

describe('metadata, duplicate, messages, list', () => {
  test('PATCH renames and validates status', async () => {
    expect((await request(app).patch(`/api/extensions/${EXT}`).set(auth).send({ title: 'New' })).body.extension.title).toBe('New');
    expect((await request(app).patch(`/api/extensions/${EXT}`).set(auth).send({ status: 'bogus' })).status).toBe(400);
    expect((await request(app).patch(`/api/extensions/${EXT}`).set(auth).send({})).status).toBe(400);
  });

  test('duplicate creates a copy owned by the user', async () => {
    repo.create.mockImplementation(async (row) => ({ id: EXT, ...row }));
    const r = await request(app).post(`/api/extensions/${EXT}/duplicate`).set(auth);
    expect(r.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: ALICE, title: 'Red Page (Copy)' }));
  });

  test('messages are returned for owners only', async () => {
    messages.list.mockResolvedValue([{ id: 'm', role: 'user', content: 'hi', meta: {}, created_at: 't' }]);
    expect((await request(app).get(`/api/extensions/${EXT}/messages`).set(auth)).body.messages[0].content).toBe('hi');
    repo.findOwned.mockResolvedValue(null);
    expect((await request(app).get(`/api/extensions/${EXT}/messages`).set(auth)).status).toBe(404);
  });

  test('list passes search, status and pagination', async () => {
    repo.listByUser.mockResolvedValue({ rows: [ext()], total: 1 });
    const r = await request(app).get('/api/extensions/my?q=red&status=draft&limit=500&offset=5').set(auth);
    expect(r.status).toBe(200);
    expect(r.body.total).toBe(1);
    expect(repo.listByUser).toHaveBeenCalledWith(ALICE, { limit: 100, offset: 5, q: 'red', status: 'draft' });
  });

  test('GET /:id includes validation', async () => {
    const r = await request(app).get(`/api/extensions/${EXT}`).set(auth);
    expect(r.body.validation.errors).toEqual([]);
  });

  test('audit result is stored on the project', async () => {
    completeWithFallback.mockRejectedValue(new Error('down'));
    const r = await request(app).post(`/api/extensions/${EXT}/audit`).set(auth);
    expect(r.body.audit.status).toBe('incomplete');
    expect(repo.updateOwned).toHaveBeenCalledWith(EXT, ALICE, { last_audit: expect.objectContaining({ status: 'incomplete' }) });
  });
});
