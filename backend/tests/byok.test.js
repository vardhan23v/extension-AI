// Bring-your-own keys: encryption, write-only API, provider resolution.
process.env.CREW_ENABLED = 'false';
process.env.BYOK_ENCRYPTION_KEY = require('crypto').randomBytes(32).toString('base64');

jest.mock('../repositories/keys.repo');
jest.mock('../services/supabase', () => {
  const getUser = jest.fn();
  return { getSupabase: () => ({ auth: { getUser } }), __getUser: getUser };
});

const request = require('supertest');
const keysRepo = require('../repositories/keys.repo');
const { __getUser } = require('../services/supabase');
const { encrypt, decrypt } = require('../services/crypto.service');
const { runWithAiContext, resolveKey } = require('../services/ai/context');
const { completeWithFallback, PROVIDERS } = require('../services/ai/providers');
const app = require('../server');

const USER = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: 'Bearer t' };
const GROQ_KEY = 'gsk_' + 'A'.repeat(40);

beforeEach(() => {
  jest.resetAllMocks();
  __getUser.mockResolvedValue({ data: { user: { id: USER, email: 'a@x.test', user_metadata: {} } }, error: null });
  keysRepo.list.mockResolvedValue([]);
  keysRepo.getSettings.mockResolvedValue({ byokOnly: false });
  global.fetch = jest.fn();
});

describe('crypto', () => {
  test('round-trips and uses a fresh IV each time', () => {
    const a = encrypt(GROQ_KEY);
    const b = encrypt(GROQ_KEY);
    expect(a).not.toBe(b);
    expect(a).not.toContain(GROQ_KEY);
    expect(decrypt(a)).toBe(GROQ_KEY);
  });
  test('detects tampering', () => {
    const parts = encrypt(GROQ_KEY).split('.');
    parts[3] = parts[3].slice(0, -2) + (parts[3].endsWith('A') ? 'BB' : 'AA');
    expect(() => decrypt(parts.join('.'))).toThrow();
  });
});

describe('key resolution', () => {
  const OLD = process.env.GROQ_API_KEY;
  beforeAll(() => { process.env.GROQ_API_KEY = 'platform-key'; });
  afterAll(() => { process.env.GROQ_API_KEY = OLD; });

  test('own key wins; platform key used otherwise', () => {
    runWithAiContext({ keys: { groq: 'mine' }, byokOnly: false }, () => expect(resolveKey('groq', 'GROQ_API_KEY')).toBe('mine'));
    runWithAiContext({ keys: {}, byokOnly: false }, () => expect(resolveKey('groq', 'GROQ_API_KEY')).toBe('platform-key'));
  });

  test('BYOK-only never falls back to platform keys', async () => {
    await runWithAiContext({ keys: {}, byokOnly: true }, async () => {
      expect(resolveKey('groq', 'GROQ_API_KEY')).toBeNull();
      await expect(completeWithFallback({ system: 's', user: 'u' })).rejects.toThrow(/no API key of your own/);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('requests carry the user key in the Authorization header', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: async () => ({ choices: [{ message: { content: 'hi' } }] }), headers: { get: () => null } });
    await runWithAiContext({ keys: { groq: 'user-groq-key' }, byokOnly: true }, () => completeWithFallback({ system: 's', user: 'u' }, (t) => t, { providers: [PROVIDERS[0]] }));
    expect(global.fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer user-groq-key');
  });
});

describe('key routes', () => {
  test('list never includes key material', async () => {
    keysRepo.list.mockResolvedValue([{ provider: 'groq', last4: 'AAAA', created_at: 't' }]);
    const r = await request(app).get('/api/user/keys').set(auth);
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toMatch(/gsk_|encrypted/);
    expect(r.body.providers.find((p) => p.id === 'groq')).toMatchObject({ saved: true, last4: 'AAAA' });
  });

  test('save verifies with the provider, stores, and does not echo the key', async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200 });
    keysRepo.save.mockResolvedValue({ provider: 'groq', last4: 'AAAA' });
    const r = await request(app).put('/api/user/keys/groq').set(auth).send({ key: GROQ_KEY });
    expect(r.status).toBe(200);
    expect(keysRepo.save).toHaveBeenCalledWith(USER, 'groq', GROQ_KEY);
    expect(JSON.stringify(r.body)).not.toContain(GROQ_KEY);
  });

  test('rejected keys are not saved', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 401 });
    const r = await request(app).put('/api/user/keys/groq').set(auth).send({ key: GROQ_KEY });
    expect(r.status).toBe(400);
    expect(r.body.message).toMatch(/rejected/);
    expect(keysRepo.save).not.toHaveBeenCalled();
  });

  test('malformed keys and unknown providers are refused before any network call', async () => {
    expect((await request(app).put('/api/user/keys/groq').set(auth).send({ key: 'sk-not-groq' })).status).toBe(400);
    expect((await request(app).put('/api/user/keys/anthropic').set(auth).send({ key: GROQ_KEY })).status).toBe(404);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('BYOK-only requires at least one saved key', async () => {
    expect((await request(app).put('/api/user/settings').set(auth).send({ byokOnly: true })).status).toBe(400);
    keysRepo.list.mockResolvedValue([{ provider: 'groq', last4: 'AAAA' }]);
    keysRepo.saveSettings.mockResolvedValue({ byok_only: true });
    expect((await request(app).put('/api/user/settings').set(auth).send({ byokOnly: true })).body.byokOnly).toBe(true);
  });

  test('delete', async () => {
    keysRepo.remove.mockResolvedValue(true);
    expect((await request(app).delete('/api/user/keys/groq').set(auth)).status).toBe(200);
    keysRepo.remove.mockResolvedValue(false);
    expect((await request(app).delete('/api/user/keys/groq').set(auth)).status).toBe(404);
  });

  test('all key routes require sign-in', async () => {
    expect((await request(app).get('/api/user/keys')).status).toBe(401);
  });
});
