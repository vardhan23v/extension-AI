// Builds a self-contained HTML document for the sandboxed visual preview.
// Chrome APIs are mocked in memory; nothing here runs with the app's origin.

const CHROME_MOCK = `
(function () {
  var store = {};
  var noop = function () {};
  var ev = { addListener: noop, removeListener: noop, hasListener: function () { return false; } };
  var later = function (cb, v) { if (typeof cb === 'function') setTimeout(function () { cb(v); }, 0); return Promise.resolve(v); };
  var pick = function (keys) {
    if (keys == null) return Object.assign({}, store);
    if (typeof keys === 'string') { var o = {}; if (keys in store) o[keys] = store[keys]; return o; }
    if (Array.isArray(keys)) return keys.reduce(function (o, k) { if (k in store) o[k] = store[k]; return o; }, {});
    return Object.keys(keys).reduce(function (o, k) { o[k] = k in store ? store[k] : keys[k]; return o; }, {});
  };
  var area = {
    get: function (k, cb) { if (typeof k === 'function') { cb = k; k = null; } return later(cb, pick(k)); },
    set: function (items, cb) { Object.assign(store, items); return later(cb); },
    remove: function (k, cb) { [].concat(k).forEach(function (x) { delete store[x]; }); return later(cb); },
    clear: function (cb) { store = {}; return later(cb); },
    onChanged: ev
  };
  var tab = { id: 1, windowId: 1, active: true, title: 'Example page', url: 'https://example.com/' };
  var any = function () { var cb = [].slice.call(arguments).filter(function (a) { return typeof a === 'function'; })[0]; return later(cb); };
  window.chrome = {
    storage: { local: area, sync: area, session: area, onChanged: ev },
    runtime: { id: 'preview', lastError: null, sendMessage: any, onMessage: ev, onInstalled: ev, getURL: function (p) { return p; }, openOptionsPage: any },
    tabs: { query: function (q, cb) { return later(cb, [tab]); }, create: any, update: any, remove: any, sendMessage: any, onUpdated: ev, onActivated: ev, onRemoved: ev },
    scripting: { executeScript: any, insertCSS: any },
    action: { setBadgeText: any, setBadgeBackgroundColor: any, onClicked: ev },
    notifications: { create: any, clear: any },
    contextMenus: { create: noop, removeAll: any, onClicked: ev },
    alarms: { create: noop, clear: any, onAlarm: ev },
    commands: { onCommand: ev },
    i18n: { getMessage: function (m) { return m; }, getUILanguage: function () { return 'en'; } },
    permissions: { contains: function (p, cb) { return later(cb, true); }, request: function (p, cb) { return later(cb, true); } }
  };
  window.addEventListener('error', function (e) { parent.postMessage({ type: 'preview-error', message: String(e.message) }, '*'); });
})();
`;

const resolve = (from, ref) => {
  const clean = ref.split(/[?#]/)[0].replace(/^\.\//, '');
  if (clean.startsWith('/')) return clean.slice(1);
  const dir = from.includes('/') ? from.slice(0, from.lastIndexOf('/') + 1) : '';
  const parts = [];
  for (const seg of (dir + clean).split('/')) {
    if (seg === '..') parts.pop();
    else if (seg && seg !== '.') parts.push(seg);
  }
  return parts.join('/');
};

const escapeScript = (code) => code.replace(/<\/script/gi, '<\\/script');

const MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' };

export const previewPages = (files) => {
  const manifestFile = files.find((f) => f.filename === 'manifest.json');
  let manifest = {};
  try {
    manifest = JSON.parse(manifestFile?.content || '{}');
  } catch {
    // invalid manifest: fall back to popup.html
  }
  const pages = [];
  const popup = manifest.action?.default_popup || (files.some((f) => f.filename === 'popup.html') ? 'popup.html' : null);
  const options = manifest.options_ui?.page || manifest.options_page;
  const side = manifest.side_panel?.default_path;
  if (popup) pages.push({ id: 'popup', label: 'Popup', file: popup });
  if (options) pages.push({ id: 'options', label: 'Options', file: options });
  if (side) pages.push({ id: 'side', label: 'Side panel', file: side });
  return pages.filter((p) => files.some((f) => f.filename === p.file));
};

export const buildPreviewDoc = (files, pageFile, { dark = false } = {}) => {
  const byName = new Map(files.map((f) => [f.filename, f]));
  const page = byName.get(pageFile);
  if (!page) return '';
  let html = page.content;

  // Inline local stylesheets.
  html = html.replace(/<link\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>/gi, (tag, href) => {
    if (!/stylesheet/i.test(tag)) return tag;
    const f = byName.get(resolve(pageFile, href));
    return f ? `<style>${f.content}</style>` : '';
  });
  // Inline local scripts; drop remote ones (they would not run in a real MV3 extension either).
  html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src) => {
    if (/^(https?:)?\/\//i.test(src)) return '<!-- remote script removed in preview -->';
    const f = byName.get(resolve(pageFile, src));
    const type = /type\s*=\s*["']module["']/i.test(tag) ? ' type="module"' : '';
    return f ? `<script${type}>${escapeScript(f.content)}</script>` : '';
  });
  // Images from the project.
  html = html.replace(/(<img\b[^>]*\bsrc\s*=\s*["'])([^"']+)(["'])/gi, (m, pre, src, post) => {
    const f = byName.get(resolve(pageFile, src));
    if (!f) return m;
    const ext = f.filename.split('.').pop().toLowerCase();
    const uri = f.encoding === 'base64' ? `data:${MIME[ext]};base64,${f.content}` : `data:${MIME[ext] || 'text/plain'};charset=utf-8,${encodeURIComponent(f.content)}`;
    return pre + uri + post;
  });

  const head = `<meta charset="utf-8"><meta name="color-scheme" content="${dark ? 'dark' : 'light'}"><script>${CHROME_MOCK}</script>`;
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + head);
  if (/<html[^>]*>/i.test(html)) return html.replace(/<html[^>]*>/i, (m) => `${m}<head>${head}</head>`);
  return `<!doctype html><html><head>${head}</head><body>${html}</body></html>`;
};
