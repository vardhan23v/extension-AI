process.env.CREW_ENABLED = 'false'; // these suites test routes; the crew has its own tests
// Route tests with the database, Supabase Auth and AI providers mocked.
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
const { __getUser } = require('../services/supabase');
const { completeWithFallback } = require('../services/ai/providers');
const { aiJson, validFiles } = require('./fixtures');
const { injectMissingIcons } = require('../services/icons.service');
const app = require('../server');

const ALICE = '11111111-1111-4111-8111-111111111111';
const BOB = '22222222-2222-4222-8222-222222222222';
const EXT = '33333333-3333-4333-8333-333333333333';

// Make the mocked provider layer run the real parse step on canned model text.
const aiReturns = (...texts) => {
  texts.forEach((t) => completeWithFallback.mockImplementationOnce(async (req, parse) => ({ provider: 'Mock', result: parse(t) })));
};

const auth = (user) => ({ Authorization: `Bearer token-${user}` });

beforeEach(() => {
  jest.resetAllMocks();
  __getUser.mockImplementation(async (token) => {
    const id = token.replace('token-', '');
    return [ALICE, BOB].includes(id)
      ? { data: { user: { id, email: `${id}@x.test`, user_metadata: {} } }, error: null }
      : { data: { user: null }, error: new Error('bad') };
  });
  repo.create.mockImplementation(async (row) => ({ id: EXT, created_at: 'now', updated_at: 'now', is_public: false, ...row }));
});

const aliceExt = (extra = {}) => ({
  id: EXT, user_id: ALICE, title: 'Red Page', prompt: 'make red', files: injectMissingIcons(validFiles(), 'x'),
  is_public: false, iteration_history: [], store_assets: {}, upvotes: 0, ...extra,
});

describe('auth', () => {
  test('401 without token', async () => {
    expect((await request(app).get('/api/extensions/my')).status).toBe(401);
  });
  test('401 with invalid token', async () => {
    expect((await request(app).get('/api/extensions/my').set({ Authorization: 'Bearer nope' })).status).toBe(401);
  });
  test('legacy login endpoint returns 410', async () => {
    expect((await request(app).post('/api/auth/login').send({})).status).toBe(410);
  });
});

describe('ownership and ids', () => {
  test('invalid id is 400', async () => {
    const r = await request(app).get('/api/extensions/download/not-an-id').set(auth(ALICE));
    expect(r.status).toBe(400);
  });
  test("another user's extension is 404 (owner filter applied)", async () => {
    repo.findOwned.mockResolvedValue(null);
    const r = await request(app).get(`/api/extensions/download/${EXT}`).set(auth(BOB));
    expect(r.status).toBe(404);
    expect(repo.findOwned).toHaveBeenCalledWith(EXT, BOB);
  });
  test('delete uses owner filter', async () => {
    repo.removeOwned.mockResolvedValue(false);
    expect((await request(app).delete(`/api/extensions/${EXT}`).set(auth(BOB))).status).toBe(404);
    expect(repo.removeOwned).toHaveBeenCalledWith(EXT, BOB);
  });
  test('audit is owner-only', async () => {
    repo.findOwned.mockResolvedValue(null);
    expect((await request(app).post(`/api/extensions/${EXT}/audit`).set(auth(BOB))).status).toBe(404);
  });
});

describe('generate', () => {
  test('valid AI output is sanitized, given icons, validated and saved', async () => {
    aiReturns(aiJson());
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'make pages red' });
    expect(r.status).toBe(201);
    const names = r.body.extension.files.map((f) => f.filename);
    expect(names).toEqual(expect.arrayContaining(['manifest.json', 'icon16.png', 'icon128.png']));
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: ALICE }));
  });

  test('empty prompt is 400', async () => {
    expect((await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: ' ' })).status).toBe(400);
  });

  test('non-https webhook is 400', async () => {
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x', webhookUrl: 'javascript:alert(1)' });
    expect(r.status).toBe(400);
  });

  test('AI provider failure is a 502 with a message, nothing saved', async () => {
    completeWithFallback.mockRejectedValue(new Error('All AI providers failed. Groq: HTTP 500'));
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x' });
    expect(r.status).toBe(502);
    expect(r.body.message).toMatch(/All AI providers failed/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test('invalid output gets one repair attempt then 422 with errors', async () => {
    const bad = validFiles({ manifest_version: 2 });
    aiReturns(aiJson(bad), aiJson(bad));
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x' });
    expect(r.status).toBe(422);
    expect(r.body.errors).toContain('manifest_version must be 3');
    expect(completeWithFallback).toHaveBeenCalledTimes(2);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test('repair attempt that fixes the output succeeds', async () => {
    aiReturns(aiJson(validFiles({ manifest_version: 2 })), aiJson());
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x' });
    expect(r.status).toBe(201);
    expect(r.body.generation.repaired).toBe(true);
  });

  test('malicious filename from AI is rejected', async () => {
    completeWithFallback.mockImplementation(async (req, parse) => ({ provider: 'M', result: parse(aiJson([...validFiles(), { filename: '../../evil.js', content: '' }])) }));
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x' });
    expect(r.status).toBe(502);
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe('iterate', () => {
  test('sends current files to the AI and snapshots a version first', async () => {
    repo.findOwned.mockResolvedValue(aliceExt());
    repo.updateOwned.mockImplementation(async (id, user, patch) => ({ ...aliceExt(), ...patch }));
    aiReturns(aiJson(validFiles(), 'Red Page Dark'));
    const r = await request(app).post(`/api/extensions/iterate/${EXT}`).set(auth(ALICE)).send({ prompt: 'dark mode' });
    expect(r.status).toBe(200);
    expect(completeWithFallback.mock.calls[0][0].user).toMatch(/--- FILE: popup\.js ---/);
    expect(repo.addVersion).toHaveBeenCalledWith(EXT, aliceExt().files, expect.stringMatching(/dark mode/));
    expect(r.body.extension.title).toBe('Red Page Dark');
  });
});

describe('download', () => {
  test('streams a zip with a safe filename', async () => {
    repo.findOwned.mockResolvedValue(aliceExt({ title: 'Bad"Name\r\n' }));
    const r = await request(app).get(`/api/extensions/download/${EXT}`).set(auth(ALICE)).buffer(true).parse((res, cb) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });
    expect(r.status).toBe(200);
    expect(r.headers['content-type']).toBe('application/zip');
    expect(r.headers['content-disposition']).toBe('attachment; filename="BadName-extension.zip"');
    expect(r.body.subarray(0, 2).toString()).toBe('PK');
  });
});

describe('upvote', () => {
  test('requires auth', async () => {
    expect((await request(app).post(`/api/extensions/${EXT}/upvote`)).status).toBe(401);
  });
  test('second vote is 409', async () => {
    repo.upvote.mockResolvedValueOnce(1).mockResolvedValueOnce(null);
    repo.findById.mockResolvedValue(aliceExt({ is_public: true, upvotes: 1 }));
    expect((await request(app).post(`/api/extensions/${EXT}/upvote`).set(auth(BOB))).body.upvotes).toBe(1);
    expect((await request(app).post(`/api/extensions/${EXT}/upvote`).set(auth(BOB))).status).toBe(409);
  });
});

describe('errors and limits', () => {
  test('database errors do not leak details', async () => {
    repo.listByUser.mockRejectedValue(Object.assign(new Error('Database error: secret column x'), { status: 500 }));
    const r = await request(app).get('/api/extensions/my').set(auth(ALICE));
    expect(r.status).toBe(500);
    expect(r.body.message).not.toMatch(/secret/);
  });
  test('oversized body is 413', async () => {
    const r = await request(app).post('/api/extensions/generate').set(auth(ALICE)).send({ prompt: 'x'.repeat(3 * 1024 * 1024) });
    expect(r.status).toBe(413);
  });
  test('AI routes are rate limited per user', async () => {
    completeWithFallback.mockResolvedValue({ provider: 'M', result: 'better prompt' });
    let last;
    for (let i = 0; i < 31; i++) {
      last = await request(app).post('/api/extensions/enhance-prompt').set(auth(BOB)).send({ prompt: 'x' });
    }
    expect(last.status).toBe(429);
  });
  test('disallowed CORS origin gets no allow-origin header', async () => {
    const r = await request(app).get('/api/extensions/gallery').set('Origin', 'https://evil.example');
    expect(r.headers['access-control-allow-origin']).toBeUndefined();
  });
});
