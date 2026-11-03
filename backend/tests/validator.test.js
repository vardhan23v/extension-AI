const { validateExtension } = require('../services/validator.service');
const { injectMissingIcons } = require('../services/icons.service');
const { validFiles, manifest } = require('./fixtures');

const withIcons = (files) => injectMissingIcons(files, 'seed');

test('valid MV3 project passes once icons are injected', () => {
  const r = validateExtension(withIcons(validFiles()));
  expect(r.errors).toEqual([]);
});

test('missing icons are reported before injection', () => {
  expect(validateExtension(validFiles()).errors.join()).toMatch(/icon16\.png/);
});

test('MV2 manifest is rejected', () => {
  const files = withIcons(validFiles({ manifest_version: 2, browser_action: {}, background: { scripts: ['bg.js'] } }));
  const { errors } = validateExtension(files);
  expect(errors).toEqual(expect.arrayContaining([
    'manifest_version must be 3',
    expect.stringMatching(/browser_action/),
    expect.stringMatching(/background.scripts/),
  ]));
});

test('missing service worker file is an error', () => {
  const { errors } = validateExtension(withIcons(validFiles({ background: { service_worker: 'bg.js' } })));
  expect(errors.join()).toMatch(/bg\.js/);
});

test('remote script in HTML is an error', () => {
  const files = withIcons(validFiles());
  files[1] = { filename: 'popup.html', content: '<script src="https://cdn.tailwindcss.com"></script><script src="popup.js"></script><link href="popup.css" rel="stylesheet">' };
  expect(validateExtension(files).errors.join()).toMatch(/remote script/);
});

test('inline scripts and handlers are errors', () => {
  const files = withIcons(validFiles());
  files[1] = { filename: 'popup.html', content: '<button onclick="go()">x</button><script>alert(1)</script><script src="popup.js"></script><link href="popup.css" rel="stylesheet">' };
  const msg = validateExtension(files).errors.join();
  expect(msg).toMatch(/inline <script>/);
  expect(msg).toMatch(/inline event handlers/);
});

test('JS syntax error is reported and code is not executed', () => {
  global.__ran = false;
  const files = withIcons(validFiles());
  files[3] = { filename: 'popup.js', content: 'global.__ran = true; let = ;' };
  expect(validateExtension(files).errors.join()).toMatch(/syntax error/);
  files[3] = { filename: 'popup.js', content: 'global.__ran = true;' };
  validateExtension(files);
  expect(global.__ran).toBe(false);
});

test('host pattern in permissions is an error; broad host is a warning', () => {
  const r = validateExtension(withIcons(validFiles({ permissions: ['<all_urls>'], host_permissions: ['*://*/*'] })));
  expect(r.errors.join()).toMatch(/host_permissions/);
  expect(r.warnings.join()).toMatch(/Broad host/);
});

test('invalid JSON manifest', () => {
  expect(validateExtension([{ filename: 'manifest.json', content: '{' }]).errors[0]).toMatch(/not valid JSON/);
});

test('missing manifest', () => {
  expect(validateExtension([{ filename: 'a.js', content: '' }]).errors).toEqual(['manifest.json is missing']);
});

test('default_locale requires messages.json', () => {
  const r = validateExtension(withIcons(validFiles({ default_locale: 'en' })));
  expect(r.errors.join()).toMatch(/_locales\/en\/messages.json/);
});

test('manifest helper is valid JSON', () => expect(() => JSON.parse(manifest())).not.toThrow());
