const { repairManifestText } = require('../utils/manifest');

const ok = (text) => JSON.parse(repairManifestText(text));

test('valid JSON is unchanged', () => {
  const t = '{"manifest_version":3,"name":"A","version":"1.0"}';
  expect(repairManifestText(t)).toBe(t);
});
test('unquoted keys and trailing commas', () => {
  expect(ok("{manifest_version: 3, name: 'Ad Blocker', version: '1.0.0', permissions: ['storage',],}")).toEqual({
    manifest_version: 3, name: 'Ad Blocker', version: '1.0.0', permissions: ['storage'],
  });
});
test('comments are removed but URLs survive', () => {
  expect(ok('{\n // comment\n "name": "A", "homepage_url": "https://x.dev/a", /* x */ "version": "1"}').homepage_url).toBe('https://x.dev/a');
});
test('double-escaped JSON', () => {
  expect(ok('{\\"manifest_version\\":3,\\"name\\":\\"A\\"}').name).toBe('A');
});
test('JSON wrapped in a string', () => {
  expect(ok(JSON.stringify('{"name":"A"}')).name).toBe('A');
});
test('hopeless input is returned as-is for the validator to report', () => {
  expect(repairManifestText('not json at all')).toBe('not json at all');
});
