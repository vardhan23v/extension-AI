// Crew orchestration with the AI provider layer mocked.
jest.mock('../services/ai/providers', () => {
  const actual = jest.requireActual('../services/ai/providers');
  return { ...actual, completeWithFallback: jest.fn() };
});
jest.mock('../repositories/extensions.repo');
jest.mock('../repositories/messages.repo');
jest.mock('../services/supabase', () => {
  const getUser = jest.fn();
  return { getSupabase: () => ({ auth: { getUser } }), __getUser: getUser };
});

const request = require('supertest');
const { completeWithFallback } = require('../services/ai/providers');
const { runCrew } = require('../services/crew/crew');
const repo = require('../repositories/extensions.repo');
const { __getUser } = require('../services/supabase');
const { aiJson, validFiles } = require('./fixtures');

const PLAN = { name: 'Red Page', summary: 'Turns pages red', features: ['button'], files: ['manifest.json', 'popup.html', 'popup.js', 'popup.css'], permissions: ['storage', 'activeTab'], hostPermissions: [], risks: [] };

// Route each call: planner calls pass `models`; everything else is the engineer.
const scripted = ({ plan = JSON.stringify(PLAN), engineer = [aiJson()] } = {}) => {
  const queue = [...engineer];
  completeWithFallback.mockImplementation(async (req, parse) => {
    if (req.models) {
      if (plan instanceof Error) throw plan;
      return { provider: 'Groq', result: parse(plan) };
    }
    const next = queue.length > 1 ? queue.shift() : queue[0];
    return { provider: 'Groq', result: parse(next) };
  });
};

const engineerCalls = () => completeWithFallback.mock.calls.filter(([req]) => !req.models);

beforeEach(() => {
  jest.resetAllMocks();
  delete process.env.CREW_ENABLED;
});

test('planner spec is passed to the engineer, all agents run in order', async () => {
  scripted();
  const events = [];
  const crew = await runCrew({ kind: 'create', prompt: 'make red', onEvent: (e) => events.push(`${e.type}:${e.agent}`) });
  expect(crew.plan.permissions).toEqual(['storage', 'activeTab']);
  expect(engineerCalls()[0][0].user).toMatch(/Implementation plan from the Product Planner/);
  expect(crew.trace.map((t) => `${t.agent}:${t.status}`)).toEqual(['planner:done', 'engineer:done', 'qa:done', 'security:done']);
  expect(events).toEqual([
    'agent:start:planner', 'agent:done:planner', 'agent:start:engineer', 'agent:done:engineer',
    'agent:start:qa', 'agent:done:qa', 'agent:start:security', 'agent:done:security',
  ]);
  expect(completeWithFallback.mock.calls[0][0].models.Groq).toBe('openai/gpt-oss-20b');
});

test('malformed planner output falls back to building without a plan', async () => {
  scripted({ plan: 'not json' });
  const crew = await runCrew({ kind: 'create', prompt: 'make red' });
  expect(crew.trace[0]).toMatchObject({ agent: 'planner', status: 'skipped' });
  expect(crew.plan).toBeNull();
  expect(engineerCalls()[0][0].user).not.toMatch(/Product Planner/);
  expect(crew.result.files.length).toBeGreaterThan(0);
});

test('QA catches a planned-but-missing file and asks for exactly one fix', async () => {
  const plan = JSON.stringify({ ...PLAN, files: [...PLAN.files, 'options.html'] });
  const withOptions = aiJson([
    ...validFiles({ options_page: 'options.html' }),
    { filename: 'options.html', content: '<!doctype html><p>Options</p>' },
  ]);
  scripted({ plan, engineer: [aiJson(), withOptions] });
  const crew = await runCrew({ kind: 'create', prompt: 'make red' });
  expect(engineerCalls()).toHaveLength(2);
  expect(engineerCalls()[1][0].user).toMatch(/Planned file "options.html" is missing/);
  expect(crew.result.files.some((f) => f.filename === 'options.html')).toBe(true);
  expect(crew.trace.find((t) => t.agent === 'qa').summary).toMatch(/Fixed/);
});

test('security analyst sends one fix for critical findings and keeps it when better', async () => {
  const risky = validFiles().map((f) => (f.filename === 'popup.js' ? { ...f, content: 'new Function("x")();' } : f));
  scripted({ engineer: [aiJson(risky), aiJson()] });
  const crew = await runCrew({ kind: 'create', prompt: 'make red' });
  expect(engineerCalls()).toHaveLength(2);
  expect(engineerCalls()[1][0].user).toMatch(/new Function/);
  expect(crew.securityFindings.filter((f) => f.severity === 'critical')).toEqual([]);
});

test('a fix that is not better is discarded', async () => {
  const risky = validFiles().map((f) => (f.filename === 'popup.js' ? { ...f, content: 'new Function("x")();' } : f));
  scripted({ engineer: [aiJson(risky), aiJson(risky)] });
  const crew = await runCrew({ kind: 'create', prompt: 'make red' });
  expect(crew.trace.find((t) => t.agent === 'security').summary).toMatch(/remain/);
});

test('tight budget skips the optional planner and review fixes', async () => {
  const risky = validFiles().map((f) => (f.filename === 'popup.js' ? { ...f, content: 'new Function("x")();' } : f));
  scripted({ engineer: [aiJson(risky)] });
  const crew = await runCrew({ kind: 'create', prompt: 'x', budgetMs: 10000 });
  expect(crew.trace[0]).toMatchObject({ agent: 'planner', status: 'skipped' });
  expect(engineerCalls()).toHaveLength(1);
  expect(crew.trace.find((t) => t.agent === 'security').summary).toMatch(/no time left/);
});

test('debug runs without the planner', async () => {
  scripted();
  const crew = await runCrew({ kind: 'debug', extension: { prompt: 'p', title: 'T', files: validFiles() }, instruction: 'TypeError' });
  expect(crew.trace.map((t) => t.agent)).toEqual(['engineer', 'qa', 'security']);
});

test('engineer failure propagates; planner failure does not', async () => {
  completeWithFallback.mockImplementation(async (req) => {
    if (req.models) throw new Error('rate limited');
    throw new Error('All AI providers failed');
  });
  await expect(runCrew({ kind: 'create', prompt: 'x' })).rejects.toThrow(/All AI providers failed/);
});

test('CREW_ENABLED=false uses the single-agent path', async () => {
  process.env.CREW_ENABLED = 'false';
  scripted();
  const crew = await runCrew({ kind: 'create', prompt: 'x' });
  expect(crew.trace).toEqual([]);
  expect(completeWithFallback.mock.calls.every(([req]) => !req.models)).toBe(true);
});

describe('SSE route', () => {
  const app = require('../server');
  const USER = '11111111-1111-4111-8111-111111111111';
  beforeEach(() => {
    __getUser.mockResolvedValue({ data: { user: { id: USER, email: 'a@x.test', user_metadata: {} } }, error: null });
    repo.create.mockImplementation(async (row) => ({ id: '33333333-3333-4333-8333-333333333333', created_at: 't', updated_at: 't', ...row }));
  });

  const events = (text) => text.split('\n\n').filter(Boolean).map((b) => b.match(/^event: (.+)$/m)[1]);

  test('streams agent events then the saved result', async () => {
    scripted();
    const r = await request(app).post('/api/extensions/generate/stream').set({ Authorization: 'Bearer t' }).send({ prompt: 'make red' });
    expect(r.headers['content-type']).toMatch(/text\/event-stream/);
    const ev = events(r.text);
    expect(ev[0]).toBe('agent:start');
    expect(ev[ev.length - 1]).toBe('result');
    expect(r.text).toMatch(/"description":"Turns pages red"/);
  });

  test('streams a structured error with validator details', async () => {
    const bad = aiJson(validFiles({ manifest_version: 2 }));
    scripted({ engineer: [bad] });
    const r = await request(app).post('/api/extensions/generate/stream').set({ Authorization: 'Bearer t' }).send({ prompt: 'x' });
    const ev = events(r.text);
    expect(ev[ev.length - 1]).toBe('error');
    expect(r.text).toMatch(/manifest_version must be 3/);
    expect(repo.create).not.toHaveBeenCalled();
  });

  test('invalid input is reported as an error event', async () => {
    const r = await request(app).post('/api/extensions/generate/stream').set({ Authorization: 'Bearer t' }).send({ prompt: '' });
    expect(r.text).toMatch(/event: error[\s\S]*"status":400/);
  });
});
