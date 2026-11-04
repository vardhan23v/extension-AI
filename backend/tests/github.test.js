// GitHub OAuth + export with a fake GitHub API.
process.env.CREW_ENABLED = 'false';
process.env.BYOK_ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('base64');
process.env.GITHUB_CLIENT_ID = 'cid';
process.env.GITHUB_CLIENT_SECRET = 'csecret';
process.env.GITHUB_OAUTH_REDIRECT_URI = 'https://app.example/api/github/callback';

jest.mock('../repositories/github.repo');
jest.mock('../repositories/extensions.repo');
jest.mock('../services/supabase', () => {
  const getUser = jest.fn();
  return { getSupabase: () => ({ auth: { getUser } }), __getUser: getUser };
});
jest.mock('../services/ai/providers', () => {
  const actual = jest.requireActual('../services/ai/providers');
  return { ...actual, completeWithFallback: jest.fn().mockRejectedValue(new Error('no ai in tests')) };
});

const request = require('supertest');
const githubRepo = require('../repositories/github.repo');
const extRepo = require('../repositories/extensions.repo');
const { __getUser } = require('../services/supabase');
const { createState } = require('../services/github.service');
const { validFiles } = require('./fixtures');
const app = require('../server');

const USER = '11111111-1111-4111-8111-111111111111';
const EXT = '33333333-3333-4333-8333-333333333333';
const auth = { Authorization: 'Bearer t' };
const TOKEN = 'gho_secrettoken123';

// Minimal fake GitHub: records calls, answers by method + path.
let calls;
let repoState;
const json = (status, body) => ({ ok: status < 300, status, json: async () => body });
const fakeGitHub = async (url, opts = {}) => {
  const method = opts.method || 'GET';
  const path = url.replace('https://api.github.com', '').replace('https://github.com', '');
  const body = opts.body ? JSON.parse(opts.body) : null;
  calls.push({ method, path, body });
  if (path === '/login/oauth/access_token') return json(200, { access_token: TOKEN, scope: 'public_repo' });
  if (path === '/user') return json(200, { login: 'octo' });
  if (method === 'POST' && path === '/user/repos') return repoState.exists ? json(422, { message: 'name already exists' }) : json(201, { full_name: `octo/${body.name}`, default_branch: 'main' });
  if (path === '/repos/octo/site') return json(200, { default_branch: 'main', permissions: { push: true } });
  if (path.startsWith('/repos/octo/site/branches?')) return json(200, repoState.empty ? [] : [{ name: 'main' }]);
  if (path.startsWith('/repos/octo/site/branches/')) return repoState.branchExists ? json(200, { name: 'x' }) : json(404, { message: 'Branch not found' });
  if (method === 'PUT' && path.includes('/contents/')) return json(201, {});
  if (path.includes('/git/ref/heads/')) return json(200, { object: { sha: 'parent-sha' } });
  if (path.includes('/git/commits/parent-sha')) return json(200, { tree: { sha: 'base-tree' } });
  if (path.endsWith('/git/blobs')) return json(201, { sha: `blob-${calls.length}` });
  if (path.endsWith('/git/trees')) return json(201, { sha: 'new-tree' });
  if (path.endsWith('/git/commits')) return json(201, { sha: 'new-commit' });
  if (method === 'PATCH' && path.includes('/git/refs/heads/')) return json(200, {});
  if (method === 'POST' && path.endsWith('/git/refs')) return json(201, {});
  if (method === 'DELETE' && path.includes('/grant')) return { ok: true, status: 204, json: async () => null };
  return json(500, { message: `unexpected ${method} ${path}` });
};

beforeEach(() => {
  jest.clearAllMocks();
  calls = [];
  repoState = { empty: false, branchExists: false, exists: false };
  global.fetch = jest.fn(fakeGitHub);
  __getUser.mockResolvedValue({ data: { user: { id: USER, email: 'a@x.test', user_metadata: {} } }, error: null });
  githubRepo.get.mockResolvedValue({ login: 'octo', scope: 'public_repo', token: TOKEN });
  githubRepo.save.mockResolvedValue({ login: 'octo' });
  githubRepo.remove.mockResolvedValue([]);
  extRepo.findOwned.mockResolvedValue({ id: EXT, title: 'Red Page', prompt: 'p', description: 'Turns pages red', files: validFiles(), store_assets: {} });
});

describe('OAuth', () => {
  test('connect returns an authorize URL with least-privilege scope and signed state', async () => {
    const r = await request(app).post('/api/github/connect').set(auth).send({});
    const url = new URL(r.body.url);
    expect(url.searchParams.get('scope')).toBe('public_repo');
    expect(url.searchParams.get('state')).toMatch(/\./);
    const priv = await request(app).post('/api/github/connect').set(auth).send({ private: true });
    expect(new URL(priv.body.url).searchParams.get('scope')).toBe('repo');
  });

  test('callback with a valid state stores the token and redirects to settings', async () => {
    const r = await request(app).get('/api/github/callback').query({ code: 'abc', state: createState(USER, false) });
    expect(r.status).toBe(302);
    expect(r.headers.location).toBe('https://app.example/settings?github=connected');
    expect(githubRepo.save).toHaveBeenCalledWith(USER, { token: TOKEN, login: 'octo', scope: 'public_repo' });
  });

  test('callback rejects a forged or missing state', async () => {
    const r = await request(app).get('/api/github/callback').query({ code: 'abc', state: 'forged.state' });
    expect(r.headers.location).toMatch(/github=error&reason=expired/);
    expect(githubRepo.save).not.toHaveBeenCalled();
  });

  test('status never exposes the token', async () => {
    const r = await request(app).get('/api/github').set(auth);
    expect(r.body).toMatchObject({ connected: true, login: 'octo', privateRepos: false });
    expect(JSON.stringify(r.body)).not.toContain(TOKEN);
  });

  test('disconnect revokes the grant and deletes the connection', async () => {
    await request(app).delete('/api/github').set(auth);
    expect(calls.some((c) => c.method === 'DELETE' && c.path === '/applications/cid/grant' && c.body.access_token === TOKEN)).toBe(true);
    expect(githubRepo.remove).toHaveBeenCalledWith(USER);
  });
});

describe('export', () => {
  const exportTo = (target) => request(app).post(`/api/extensions/${EXT}/github`).set(auth).send({ target });

  test('new repo: creates it, commits all files + README, fast-forwards main', async () => {
    const r = await exportTo({ mode: 'new', name: 'red-page' });
    expect(r.status).toBe(200);
    expect(r.body).toMatchObject({ repo: 'octo/red-page', branch: 'main', createdRepo: true });
    expect(calls.filter((c) => c.path.endsWith('/git/blobs'))).toHaveLength(validFiles().length + 1);
    const tree = calls.find((c) => c.path.endsWith('/git/trees')).body.tree.map((t) => t.path);
    expect(tree).toEqual(expect.arrayContaining(['manifest.json', 'README.md']));
    const patch = calls.find((c) => c.method === 'PATCH');
    expect(patch.body).toEqual({ sha: 'new-commit', force: false });
    expect(calls.find((c) => c.path.endsWith('/git/commits') && c.method === 'POST').body.message).toBe('Add Red Page Chrome extension (Manifest V3)');
  });

  test('new repo name taken → clear 409', async () => {
    repoState.exists = true;
    const r = await exportTo({ mode: 'new', name: 'red-page' });
    expect(r.status).toBe(409);
    expect(r.body.message).toMatch(/already exists/);
  });

  test('existing non-empty repo without a new branch is refused (nothing written)', async () => {
    const r = await exportTo({ mode: 'existing', repo: 'octo/site' });
    expect(r.status).toBe(400);
    expect(calls.some((c) => ['POST', 'PATCH', 'PUT'].includes(c.method))).toBe(false);
  });

  test('existing non-empty repo with an existing branch name is refused', async () => {
    repoState.branchExists = true;
    expect((await exportTo({ mode: 'existing', repo: 'octo/site', branch: 'extensio' })).status).toBe(409);
  });

  test('existing non-empty repo with a new branch creates that branch; main untouched', async () => {
    const r = await exportTo({ mode: 'existing', repo: 'octo/site', branch: 'extensio-export' });
    expect(r.status).toBe(200);
    expect(calls.find((c) => c.method === 'POST' && c.path.endsWith('/git/refs')).body).toEqual({ ref: 'refs/heads/extensio-export', sha: 'new-commit' });
    expect(calls.some((c) => c.method === 'PATCH')).toBe(false);
  });

  test('existing empty repo is initialised then committed to', async () => {
    repoState.empty = true;
    const r = await exportTo({ mode: 'existing', repo: 'octo/site' });
    expect(r.status).toBe(200);
    expect(calls.some((c) => c.method === 'PUT' && c.path.endsWith('/contents/.gitkeep'))).toBe(true);
  });

  test('private repo needs the private scope', async () => {
    expect((await exportTo({ mode: 'new', name: 'secret', private: true })).status).toBe(403);
  });

  test('bad names and no connection', async () => {
    expect((await exportTo({ mode: 'new', name: '../evil' })).status).toBe(400);
    githubRepo.get.mockResolvedValue(null);
    expect((await exportTo({ mode: 'new', name: 'x' })).status).toBe(409);
  });

  test('owner only', async () => {
    extRepo.findOwned.mockResolvedValue(null);
    expect((await exportTo({ mode: 'new', name: 'x' })).status).toBe(404);
  });
});
