const { completeWithFallback, ProviderError } = require('../services/ai/providers');
const { parseExtensionResponse } = require('../services/ai/parse');

const provider = (name, impl) => ({ name, isConfigured: () => true, complete: jest.fn(impl) });

test('falls back to the next provider when parse fails', async () => {
  const a = provider('A', async () => 'not json');
  const b = provider('B', async () => JSON.stringify({ title: 't', files: [{ filename: 'manifest.json', content: '{}' }] }));
  const r = await completeWithFallback({}, parseExtensionResponse, { providers: [a, b] });
  expect(r.provider).toBe('B');
});

test('retries once on retryable errors', async () => {
  let n = 0;
  const a = provider('A', async () => {
    if (n++ === 0) throw new ProviderError('A', 'HTTP 429', { retryable: true });
    return 'ok';
  });
  const r = await completeWithFallback({}, (t) => t, { providers: [a] });
  expect(r.result).toBe('ok');
  expect(a.complete).toHaveBeenCalledTimes(2);
}, 10000);

test('reports all provider errors when everything fails', async () => {
  const a = provider('A', async () => { throw new ProviderError('A', 'HTTP 401'); });
  const b = provider('B', async () => { throw new ProviderError('B', 'HTTP 400'); });
  await expect(completeWithFallback({}, (t) => t, { providers: [a, b] })).rejects.toThrow(/A: HTTP 401 \| B: HTTP 400/);
  expect(a.complete).toHaveBeenCalledTimes(1);
});

test('no configured providers is a clear error', async () => {
  await expect(completeWithFallback({}, (t) => t, { providers: [{ name: 'A', isConfigured: () => false }] })).rejects.toThrow(/no AI provider/);
});

describe('parseExtensionResponse', () => {
  test('handles markdown fences', () => {
    const r = parseExtensionResponse('```json\n{"title":"T","files":[{"filename":"a.js","content":""}]}\n```');
    expect(r.title).toBe('T');
  });
  test('drops image entries without content', () => {
    const r = parseExtensionResponse(JSON.stringify({ title: 'T', files: [{ filename: 'a.js', content: '' }, { filename: 'icon16.png' }, { filename: 'icon48.png', content: null }] }));
    expect(r.files.map((f) => f.filename)).toEqual(['a.js']);
  });
  test.each([
    ['garbage', /JSON/],
    ['{"title":"T"}', /no files/],
    ['{"files":[{"filename":"a"}]}', /title/],
    ['{"title":"T","files":[{"content":"x"}]}', /malformed/],
  ])('rejects %p', (input, re) => expect(() => parseExtensionResponse(input)).toThrow(re));
});
