jest.mock('../services/ai/providers', () => ({ completeWithFallback: jest.fn() }));
const { completeWithFallback } = require('../services/ai/providers');
const { runStaticChecks } = require('../services/security/staticChecks');
const { auditExtension } = require('../services/security/audit.service');
const { injectMissingIcons } = require('../services/icons.service');
const { validFiles } = require('./fixtures');

const clean = () => injectMissingIcons(validFiles(), 'x');
const ids = (files) => runStaticChecks(files).map((f) => f.id);

test('clean extension has no static findings', () => expect(runStaticChecks(clean())).toEqual([]));

test('detects dangerous patterns', () => {
  const files = [
    ...clean().filter((f) => f.filename !== 'popup.js'),
    {
      filename: 'popup.js',
      content: [
        "const k = 'AIza" + 'A'.repeat(35) + "';",
        'new Function("x")();',
        'setTimeout("go()", 10);',
        'el.innerHTML = userInput;',
        "fetch('http://example.com/api');",
        'chrome.runtime.onMessageExternal.addListener(() => {});',
      ].join('\n'),
    },
  ];
  expect(ids(files)).toEqual(expect.arrayContaining(['secret', 'new-function', 'string-timer', 'inner-html', 'insecure-http', 'external-message']));
});

test('flags broad host access and unsafe CSP', () => {
  const files = clean();
  const m = JSON.parse(files[0].content);
  m.host_permissions = ['<all_urls>'];
  m.content_security_policy = { extension_pages: "script-src 'self' 'unsafe-eval'" };
  files[0] = { filename: 'manifest.json', content: JSON.stringify(m) };
  expect(ids(files)).toEqual(expect.arrayContaining(['host-broad', 'csp-unsafe']));
});

test('static innerHTML string literal is not flagged', () => {
  const files = [...clean().filter((f) => f.filename !== 'popup.js'), { filename: 'popup.js', content: "el.innerHTML = '';" }];
  expect(ids(files)).not.toContain('inner-html');
});

describe('audit status', () => {
  beforeEach(() => completeWithFallback.mockReset());

  test('AI failure on a clean extension is "incomplete", never safe', async () => {
    completeWithFallback.mockRejectedValue(new Error('All AI providers failed'));
    const r = await auditExtension(clean());
    expect(r.status).toBe('incomplete');
    expect(r.checks.ai).toBe('failed');
    expect(r).not.toHaveProperty('isSafe');
    expect(r).not.toHaveProperty('score');
  });

  test('AI failure with findings is "findings"', async () => {
    completeWithFallback.mockRejectedValue(new Error('down'));
    const files = [...clean().filter((f) => f.filename !== 'popup.js'), { filename: 'popup.js', content: 'new Function("a")' }];
    expect((await auditExtension(files)).status).toBe('findings');
  });

  test('clean + AI completed is "passed"', async () => {
    completeWithFallback.mockResolvedValue({ provider: 'X', result: { summary: 'ok', additionalConcerns: [] } });
    const r = await auditExtension(clean());
    expect(r.status).toBe('passed');
    expect(r.aiSummary).toBe('ok');
    expect(r.disclaimer).toMatch(/not a security certification/);
  });
});
