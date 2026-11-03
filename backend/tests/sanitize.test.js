const { sanitizeFiles, normalizeFilename, safeDownloadName } = require('../utils/sanitize');

describe('normalizeFilename', () => {
  test.each(['../x.js', 'a/../../x.js', '/etc/passwd.txt', 'C:/x.js', 'a\\b.js', 'a\0.js', '', 'run.sh', 'noext'])(
    'rejects %p',
    (name) => expect(() => normalizeFilename(name)).toThrow()
  );
  test('normalizes ./ prefix', () => expect(normalizeFilename('./js/popup.js')).toBe('js/popup.js'));
  test('allows locales', () => expect(normalizeFilename('_locales/en/messages.json')).toBe('_locales/en/messages.json'));
});

describe('sanitizeFiles', () => {
  test('rejects eval', () => expect(() => sanitizeFiles([{ filename: 'a.js', content: 'eval("1")' }])).toThrow(/eval/));
  test('rejects duplicates', () =>
    expect(() => sanitizeFiles([{ filename: 'a.js', content: '' }, { filename: './a.js', content: '' }])).toThrow(/Duplicate/));
  test('rejects oversize file', () =>
    expect(() => sanitizeFiles([{ filename: 'a.js', content: 'x'.repeat(600 * 1024) }])).toThrow(/too large/));
  test('rejects empty list', () => expect(() => sanitizeFiles([])).toThrow());
  test('stringifies object content (e.g. manifest as object)', () => {
    const [f] = sanitizeFiles([{ filename: 'manifest.json', content: { a: 1 } }]);
    expect(JSON.parse(f.content)).toEqual({ a: 1 });
  });
  test('keeps base64 encoding flag', () => {
    const [f] = sanitizeFiles([{ filename: 'i.png', content: 'AAAA', encoding: 'base64' }]);
    expect(f.encoding).toBe('base64');
  });
});

test('safeDownloadName strips header-breaking characters', () => {
  expect(safeDownloadName('My "Ext"\r\nX: y')).toBe('My-ExtX-y');
  expect(safeDownloadName('')).toBe('extension');
});
