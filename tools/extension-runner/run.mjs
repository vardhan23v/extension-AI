// Extensio Testing Lab runner.
// Downloads a frozen copy of the project from the API, loads it as an unpacked
// extension in Chromium, checks what can be checked, and posts a signed report.
//
// Env: API_BASE_URL (e.g. https://extension-ai-five.vercel.app/api), TEST_RUNNER_SECRET, RUN_ID
// Local: RUN_LOCAL_DIR=/path/to/unpacked-extension node run.mjs   (prints the report, posts nothing)
import { chromium } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const { API_BASE_URL, TEST_RUNNER_SECRET, RUN_ID, RUN_LOCAL_DIR } = process.env;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sign = (purpose) => crypto.createHmac('sha256', TEST_RUNNER_SECRET).update(`${purpose}:${RUN_ID}`).digest('hex');
const started = Date.now();

const api = async (method, route, purpose, body) => {
  const res = await fetch(`${API_BASE_URL}/test-runs/${RUN_ID}/${route}`, {
    method,
    headers: { 'X-Runner-Signature': `sha256=${sign(purpose)}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${route}: HTTP ${res.status} ${await res.text()}`);
  return res.json();
};

// Writes project files into a fresh directory, refusing anything that escapes it.
const writeProject = async (files) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ext-'));
  for (const f of files) {
    const target = path.resolve(dir, f.filename);
    if (!target.startsWith(dir + path.sep)) throw new Error(`Unsafe path: ${f.filename}`);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, f.encoding === 'base64' ? Buffer.from(f.content, 'base64') : f.content);
  }
  return dir;
};

// Chrome derives an unpacked extension's id from its absolute path.
const extensionIdForPath = (p) =>
  [...crypto.createHash('sha256').update(p).digest('hex').slice(0, 32)].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');

// Local page that content scripts can match (http://localhost:<port>/).
const startTestServer = () =>
  new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<!doctype html><html><head><title>Extensio test page</title></head><body><h1>Test page</h1><p>Some text to select and work with.</p><a href="#">Link</a></body></html>');
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });

const matchesLocal = (patterns = []) =>
  patterns.some((p) => p === '<all_urls>' || /^(\*|https?):\/\/(\*|localhost|127\.0\.0\.1)(:\*)?\//.test(p));

const run = async () => {
  if (!RUN_LOCAL_DIR && (!API_BASE_URL || !TEST_RUNNER_SECRET || !UUID.test(RUN_ID || ''))) throw new Error('Missing or invalid API_BASE_URL / TEST_RUNNER_SECRET / RUN_ID');

  let dir = RUN_LOCAL_DIR;
  if (!dir) {
    const bundle = await api('GET', 'bundle', 'bundle');
    dir = await writeProject(bundle.files);
  }
  dir = await fs.realpath(dir);
  const manifest = JSON.parse(await fs.readFile(path.join(dir, 'manifest.json'), 'utf8'));
  const checks = [];
  const consoleErrors = [];
  const blockedRequests = [];
  const screenshots = [];
  const notTested = [
    'Behaviour that needs real websites or signed-in accounts',
    'Network calls to external servers (blocked during the test)',
    'Keyboard shortcuts, context-menu clicks and notifications',
  ];
  const add = (id, title, status, detail = '') => checks.push({ id, title, status, detail });

  const server = await startTestServer();
  const port = server.address().port;
  const userDataDir = await fs.mkdtemp(path.join(os.tmpdir(), 'profile-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium', // new headless mode, which supports extensions
    headless: true,
    args: [`--disable-extensions-except=${dir}`, `--load-extension=${dir}`],
    viewport: { width: 1280, height: 800 },
  });

  // Only the extension itself and the local test page may be reached.
  await context.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('chrome-extension://') || url.startsWith(`http://127.0.0.1:${port}`) || url.startsWith('data:') || url.startsWith('blob:')) return route.continue();
    if (blockedRequests.length < 20) blockedRequests.push(url.slice(0, 200));
    return route.abort();
  });

  try {
    // 1. Service worker
    let extId = extensionIdForPath(dir);
    if (manifest.background?.service_worker) {
      let sw = context.serviceWorkers().find((w) => w.url().startsWith('chrome-extension://'));
      if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => null);
      if (sw) {
        extId = new URL(sw.url()).host;
        add('service-worker', 'Background service worker starts', 'pass', sw.url().split('/').pop());
      } else {
        add('service-worker', 'Background service worker starts', 'fail', 'No service worker registered within 15 s — check background.js for errors on load.');
      }
    } else {
      add('service-worker', 'Background service worker starts', 'skip', 'This extension has no service worker.');
    }
    add('load', 'Chrome loads the extension', 'pass', `id ${extId}`);

    // 2. Extension pages
    const openPage = async (id, title, file, shotName) => {
      if (!file) return add(id, title, 'skip', 'Not declared in the manifest.');
      const page = await context.newPage();
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      if (id === 'popup') await page.setViewportSize({ width: 420, height: 600 });
      try {
        await page.goto(`chrome-extension://${extId}/${file}`, { waitUntil: 'load', timeout: 15000 });
        await page.waitForTimeout(800);
        const text = (await page.locator('body').innerText().catch(() => '')).trim();
        if (shotName) {
          const shot = await page.screenshot({ fullPage: false });
          screenshots.push({ name: shotName, data: shot.toString('base64') });
        }
        errors.forEach((message) => consoleErrors.push({ source: file, message }));
        if (errors.length) add(id, title, 'fail', `${errors.length} error(s): ${errors[0].slice(0, 200)}`);
        else if (!text) add(id, title, 'warn', 'Opened without errors but shows no text.');
        else add(id, title, 'pass', 'Opened without console errors.');
      } catch (e) {
        add(id, title, 'fail', `Could not open ${file}: ${e.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    };
    await openPage('popup', 'Popup opens without errors', manifest.action?.default_popup, 'popup');
    await openPage('options', 'Options page opens without errors', manifest.options_ui?.page || manifest.options_page, 'options');
    await openPage('side-panel', 'Side panel opens without errors', manifest.side_panel?.default_path);

    // 3. Content scripts on a matching local page
    const cs = manifest.content_scripts || [];
    if (!cs.length) add('content-scripts', 'Content scripts run on a page', 'skip', 'No content scripts declared.');
    else if (!cs.some((c) => matchesLocal(c.matches))) {
      add('content-scripts', 'Content scripts run on a page', 'skip', `Scripts only match ${cs.flatMap((c) => c.matches).slice(0, 3).join(', ')}; not reachable in the test.`);
    } else {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
      await page.waitForTimeout(1500);
      errors.forEach((message) => consoleErrors.push({ source: 'content script page', message }));
      add('content-scripts', 'Content scripts run on a page', errors.length ? 'fail' : 'pass', errors.length ? errors[0].slice(0, 200) : 'Matching page loaded with no errors.');
      await page.close();
    }

    if (blockedRequests.length) add('network', 'No unexpected network requests', 'warn', `${blockedRequests.length} request(s) to external hosts were blocked during the test.`);
  } finally {
    await context.close();
    server.close();
  }

  return {
    checks,
    consoleErrors,
    blockedRequests,
    screenshots,
    chromium: chromium.name(),
    durationMs: Date.now() - started,
    notTested,
  };
};

try {
  const report = await run();
  if (RUN_LOCAL_DIR) {
    console.log(JSON.stringify({ ...report, screenshots: report.screenshots.map((s) => ({ name: s.name, bytes: s.data.length })) }, null, 2));
  } else {
    const res = await api('POST', 'result', 'result', report);
    console.log(`Reported: ${res.status} (${report.checks.length} checks)`);
  }
} catch (err) {
  console.error('Runner failed:', err.message);
  if (!RUN_LOCAL_DIR && API_BASE_URL && TEST_RUNNER_SECRET && UUID.test(RUN_ID || '')) {
    await api('POST', 'result', 'result', { error: `Runner failed: ${err.message.slice(0, 300)}` }).catch(() => {});
  }
  process.exit(1);
}
