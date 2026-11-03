// Phase A: import ZIP + publishing assistant.
process.env.CREW_ENABLED = 'false';
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
const { zipSync, strToU8 } = require('fflate');
const repo = require('../repositories/extensions.repo');
const { __getUser } = require('../services/supabase');
const { completeWithFallback } = require('../services/ai/providers');
const { readExtensionZip } = require('../services/import.service');
const { buildChecklist } = require('../services/publishing.service');
const { createZipBuffer } = require('../services/zipper.service');
const { injectMissingIcons } = require('../services/icons.service');
const { validFiles, manifest } = require('./fixtures');
const app = require('../server');

const USER = '11111111-1111-4111-8111-111111111111';
const EXT = '33333333-3333-4333-8333-333333333333';
const auth = { Authorization: 'Bearer t' };

const zipOf = (entries) => Buffer.from(zipSync(Object.fromEntries(Object.entries(entries).map(([k, v]) => [k, typeof v === 'string' ? strToU8(v) : v]))));
const projectZip = (prefix = '') => {
  const files = Object.fromEntries(validFiles().map((f) => [prefix + f.filename, f.content]));
  return zipOf(files);
};

describe('readExtensionZip', () => {
  test('reads files and strips a shared top-level folder', () => {
    const { files } = readExtensionZip(projectZip('my-ext/'));
    expect(files.map((f) => f.filename).sort()).toEqual(['manifest.json', 'popup.css', 'popup.html', 'popup.js']);
  });

  test('round-trips our own ZIP including binary icons', async () => {
    const original = injectMissingIcons(validFiles(), 'x');
    const { files } = readExtensionZip(await createZipBuffer(original));
    const icon = files.find((f) => f.filename === 'icon48.png');
    expect(icon.encoding).toBe('base64');
    expect(icon.content).toBe(original.find((f) => f.filename === 'icon48.png').content);
  });

  test('skips __MACOSX, dotfiles and unsupported types', () => {
    const { files, skipped } = readExtensionZip(
      zipOf({ 'manifest.json': manifest(), '__MACOSX/._manifest.json': 'x', '.DS_Store': 'x', 'notes.docx': 'x' })
    );
    expect(files.map((f) => f.filename)).toEqual(['manifest.json']);
    expect(skipped).toEqual(['notes.docx']);
  });

  test.each([
    ['not a zip', Buffer.from('hello world, definitely not a zip file')],
    ['missing manifest', zipOf({ 'popup.html': '<p>x</p>' })],
    ['path traversal', zipOf({ 'manifest.json': manifest(), '../evil.js': 'x' })],
    ['eval', zipOf({ 'manifest.json': manifest(), 'a.js': 'eval("1")' })],
  ])('rejects %s', (_, buf) => {
    expect(() => readExtensionZip(buf)).toThrow();
  });

  test('rejects too many entries', () => {
    const many = { 'manifest.json': manifest() };
    for (let i = 0; i < 205; i++) many[`f${i}.js`] = '';
    expect(() => readExtensionZip(zipOf(many))).toThrow(/Too many files/);
  });

  test('rejects archives that declare more than 8 MB unpacked', () => {
    const big = zipOf({ 'manifest.json': manifest(), 'big.js': 'a'.repeat(9 * 1024 * 1024) });
    expect(() => readExtensionZip(big)).toThrow(/too large/);
  });

  test('detects a tampered entry via CRC', () => {
    const tampered = Buffer.from(projectZip());
    // First local header: data starts after the 30-byte header, name and extra field.
    const dataStart = 30 + tampered.readUInt16LE(26) + tampered.readUInt16LE(28);
    tampered[dataStart + 3] ^= 0xff;
    expect(() => readExtensionZip(tampered)).toThrow(/integrity|Corrupted|Unsupported|invalid/i);
  });
});

describe('buildChecklist', () => {
  const files = injectMissingIcons(validFiles(), 'x');
  test('flags missing kit items and unjustified permissions', () => {
    const { items, ready } = buildChecklist(files, {});
    const byId = Object.fromEntries(items.map((i) => [i.id, i.status]));
    expect(byId).toMatchObject({ mv3: 'pass', name: 'pass', description: 'pass', icon: 'pass', permissions: 'todo', 'single-purpose': 'todo', listing: 'todo', screenshots: 'manual' });
    expect(ready).toBe(false);
  });

  test('complete kit makes it ready (manual steps aside)', () => {
    const kit = { longDescription: 'Turns pages red.', category: 'Tools', singlePurpose: 'Turn pages red', permissionJustifications: { storage: 'Saves preference', activeTab: 'Acts on current tab' } };
    const { ready } = buildChecklist(files, { kit });
    expect(ready).toBe(true);
  });

  test('requires a privacy policy when code sends data', () => {
    const f = files.map((x) => (x.filename === 'popup.js' ? { ...x, content: "fetch('https://api.example.com')" } : x));
    expect(buildChecklist(f, {}).items.find((i) => i.id === 'privacy').status).toBe('todo');
  });
});

describe('routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    __getUser.mockResolvedValue({ data: { user: { id: USER, email: 'a@x.test', user_metadata: {} } }, error: null });
    repo.create.mockImplementation(async (row) => ({ id: EXT, created_at: 't', updated_at: 't', ...row }));
    repo.findOwned.mockResolvedValue({ id: EXT, user_id: USER, title: 'Red Page', prompt: 'p', files: injectMissingIcons(validFiles(), 'x'), store_assets: {} });
    repo.updateOwned.mockImplementation(async (id, u, patch) => ({ id, files: injectMissingIcons(validFiles(), 'x'), ...patch }));
  });

  test('import creates a project owned by the user, titled from the manifest', async () => {
    const r = await request(app).post('/api/extensions/import').set(auth).set('Content-Type', 'application/zip').send(projectZip('pkg/'));
    expect(r.status).toBe(201);
    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ user_id: USER, title: 'Red Page' }));
    expect(r.body.extension.files.some((f) => f.filename === 'icon128.png')).toBe(true);
  });

  test('import rejects bad archives with 400 and requires auth', async () => {
    expect((await request(app).post('/api/extensions/import').set(auth).set('Content-Type', 'application/zip').send(Buffer.from('nope'))).status).toBe(400);
    expect((await request(app).post('/api/extensions/import').set('Content-Type', 'application/zip').send(projectZip())).status).toBe(401);
  });

  test('publishing checklist is owner-only', async () => {
    expect((await request(app).get(`/api/extensions/${EXT}/publishing`).set(auth)).body.checklist.items.length).toBeGreaterThan(5);
    repo.findOwned.mockResolvedValue(null);
    expect((await request(app).get(`/api/extensions/${EXT}/publishing`).set(auth)).status).toBe(404);
  });

  test('drafting a kit validates the AI output and saves it', async () => {
    completeWithFallback.mockImplementation(async (req, parse) => ({
      provider: 'M',
      result: parse(JSON.stringify({ shortDescription: 'Red', longDescription: 'Makes pages red.', category: 'Nonsense', singlePurpose: 'Red', permissionJustifications: { storage: 'prefs', extra: 'ignored' }, privacyPolicy: '# None' })),
    }));
    const r = await request(app).post(`/api/extensions/${EXT}/publishing/kit`).set(auth);
    expect(r.status).toBe(200);
    expect(r.body.kit.category).toBe('Tools');
    expect(Object.keys(r.body.kit.permissionJustifications)).toEqual(['storage', 'activeTab']);
    expect(repo.updateOwned).toHaveBeenCalledWith(EXT, USER, { store_assets: expect.objectContaining({ kit: expect.any(Object) }) });
  });

  test('AI failure while drafting is a clear 502', async () => {
    completeWithFallback.mockRejectedValue(new Error('down'));
    expect((await request(app).post(`/api/extensions/${EXT}/publishing/kit`).set(auth)).status).toBe(502);
  });

  test('store package needs a kit, then contains extension/ and listing files', async () => {
    expect((await request(app).get(`/api/extensions/${EXT}/publishing/package`).set(auth)).status).toBe(409);
    repo.findOwned.mockResolvedValue({ id: EXT, user_id: USER, title: 'Red Page', prompt: 'p', files: validFiles(), store_assets: { kit: { shortDescription: 's', longDescription: 'l', category: 'Tools', singlePurpose: 'x', permissionJustifications: {}, privacyPolicy: '# P' } } });
    const r = await request(app).get(`/api/extensions/${EXT}/publishing/package`).set(auth).buffer(true).parse((res, cb) => {
      const c = [];
      res.on('data', (d) => c.push(d));
      res.on('end', () => cb(null, Buffer.concat(c)));
    });
    expect(r.status).toBe(200);
    const names = readExtensionZipNames(r.body);
    expect(names).toEqual(expect.arrayContaining(['extension/manifest.json', 'store-listing.md', 'privacy-policy.md']));
  });
});

// Lists entry names via fflate (bypasses our manifest-at-root requirement).
function readExtensionZipNames(buf) {
  const { unzipSync } = require('fflate');
  return Object.keys(unzipSync(new Uint8Array(buf)));
}
