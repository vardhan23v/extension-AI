const vm = require('vm');
const path = require('path');

// Known Manifest V3 API permissions (https://developer.chrome.com/docs/extensions/reference/permissions-list).
const KNOWN_PERMISSIONS = new Set([
  'activeTab', 'alarms', 'background', 'bookmarks', 'browsingData', 'certificateProvider', 'clipboardRead',
  'clipboardWrite', 'contentSettings', 'contextMenus', 'cookies', 'debugger', 'declarativeContent',
  'declarativeNetRequest', 'declarativeNetRequestWithHostAccess', 'declarativeNetRequestFeedback', 'dns',
  'documentScan', 'downloads', 'downloads.open', 'downloads.ui', 'enterprise.deviceAttributes',
  'enterprise.hardwarePlatform', 'enterprise.networkingAttributes', 'enterprise.platformKeys', 'favicon',
  'fileBrowserHandler', 'fileSystemProvider', 'fontSettings', 'gcm', 'geolocation', 'history', 'identity',
  'identity.email', 'idle', 'loginState', 'management', 'nativeMessaging', 'notifications', 'offscreen',
  'pageCapture', 'platformKeys', 'power', 'printerProvider', 'printing', 'printingMetrics', 'privacy',
  'processes', 'proxy', 'readingList', 'runtime', 'scripting', 'search', 'sessions', 'sidePanel', 'storage',
  'system.cpu', 'system.display', 'system.memory', 'system.storage', 'tabCapture', 'tabGroups', 'tabs',
  'topSites', 'tts', 'ttsEngine', 'unlimitedStorage', 'userScripts', 'vpnProvider', 'wallpaper', 'webAuthenticationProxy',
  'webNavigation', 'webRequest', 'webRequestAuthProvider',
]);

const HIGH_RISK_PERMISSIONS = new Set([
  'debugger', 'management', 'nativeMessaging', 'proxy', 'privacy', 'cookies', 'history', 'webRequest',
  'webRequestAuthProvider', 'browsingData', 'userScripts', 'contentSettings', 'clipboardRead',
]);

const BROAD_HOSTS = new Set(['<all_urls>', '*://*/*', 'http://*/*', 'https://*/*']);

const isRemote = (ref) => /^(https?:)?\/\//i.test(ref);
const isIgnorableRef = (ref) => /^(data:|blob:|#|mailto:|chrome:|javascript:)/i.test(ref);

const resolveRef = (fromFile, ref) => {
  const clean = ref.split(/[?#]/)[0];
  if (clean.startsWith('/')) return clean.slice(1);
  return path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), clean));
};

const isHostPattern = (p) => p === '<all_urls>' || /^(\*|https?|wss?|ftp|file):\/\//.test(p);

/**
 * Validates a generated extension's file set. Parses but never executes code.
 * @returns {{ errors: string[], warnings: string[], manifest: object|null }}
 */
const validateExtension = (files) => {
  const errors = [];
  const warnings = [];
  const byName = new Map(files.map((f) => [f.filename, f]));
  const has = (name) => byName.has(name.replace(/^\.?\//, ''));

  const manifestFile = byName.get('manifest.json');
  if (!manifestFile) {
    return { errors: ['manifest.json is missing'], warnings, manifest: null };
  }

  let manifest;
  try {
    manifest = JSON.parse(manifestFile.content);
  } catch (e) {
    return { errors: [`manifest.json is not valid JSON: ${e.message}`], warnings, manifest: null };
  }
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return { errors: ['manifest.json must be a JSON object'], warnings, manifest: null };
  }

  // --- Core fields
  if (manifest.manifest_version !== 3) errors.push('manifest_version must be 3');
  if (typeof manifest.name !== 'string' || !manifest.name.trim()) errors.push('manifest "name" is required');
  else if (manifest.name.length > 75 && !manifest.name.startsWith('__MSG_')) errors.push('manifest "name" must be at most 75 characters');
  if (typeof manifest.version !== 'string' || !/^\d+(\.\d+){0,3}$/.test(manifest.version)) {
    errors.push('manifest "version" must be 1-4 dot-separated integers, e.g. "1.0.0"');
  }
  if (manifest.description && manifest.description.length > 132 && !String(manifest.description).startsWith('__MSG_')) {
    warnings.push('manifest "description" exceeds 132 characters (Chrome Web Store limit)');
  }

  // --- MV2 leftovers
  if (manifest.browser_action) errors.push('"browser_action" is Manifest V2; use "action"');
  if (manifest.page_action) errors.push('"page_action" is Manifest V2; use "action"');
  if (manifest.background?.scripts) errors.push('"background.scripts" is Manifest V2; use "background.service_worker"');
  if (manifest.background?.persistent !== undefined) errors.push('"background.persistent" is not supported in Manifest V3');
  if (typeof manifest.content_security_policy === 'string') {
    errors.push('"content_security_policy" must be an object in Manifest V3 ({ "extension_pages": "..." })');
  }
  if (Array.isArray(manifest.web_accessible_resources) && manifest.web_accessible_resources.some((r) => typeof r === 'string')) {
    errors.push('"web_accessible_resources" entries must be objects with "resources" and "matches" in Manifest V3');
  }

  // --- Referenced files
  const refs = [];
  const addRef = (file, where) => typeof file === 'string' && refs.push({ file, where });
  addRef(manifest.background?.service_worker, 'background.service_worker');
  addRef(manifest.action?.default_popup, 'action.default_popup');
  addRef(manifest.options_page, 'options_page');
  addRef(manifest.options_ui?.page, 'options_ui.page');
  addRef(manifest.side_panel?.default_path, 'side_panel.default_path');
  addRef(manifest.devtools_page, 'devtools_page');
  for (const [k, v] of Object.entries(manifest.chrome_url_overrides || {})) addRef(v, `chrome_url_overrides.${k}`);
  for (const [size, f] of Object.entries(manifest.icons || {})) addRef(f, `icons.${size}`);
  if (typeof manifest.action?.default_icon === 'string') addRef(manifest.action.default_icon, 'action.default_icon');
  for (const [size, f] of Object.entries(typeof manifest.action?.default_icon === 'object' ? manifest.action.default_icon : {})) {
    addRef(f, `action.default_icon.${size}`);
  }
  (manifest.content_scripts || []).forEach((cs, i) => {
    if (!Array.isArray(cs.matches) || cs.matches.length === 0) errors.push(`content_scripts[${i}] needs a non-empty "matches" array`);
    (cs.js || []).forEach((f) => addRef(f, `content_scripts[${i}].js`));
    (cs.css || []).forEach((f) => addRef(f, `content_scripts[${i}].css`));
  });
  for (const { file, where } of refs) {
    if (isRemote(file)) errors.push(`${where} points to a remote URL (${file}); extension files must be packaged`);
    else if (!has(file)) errors.push(`${where} references "${file}", which is not in the project`);
  }
  if (manifest.default_locale && !has(`_locales/${manifest.default_locale}/messages.json`)) {
    errors.push(`default_locale "${manifest.default_locale}" requires _locales/${manifest.default_locale}/messages.json`);
  }
  const usesMsg = JSON.stringify(manifest).includes('__MSG_');
  if (usesMsg && !manifest.default_locale) errors.push('manifest uses __MSG_ placeholders but has no "default_locale"');

  // --- Permissions
  const permissions = Array.isArray(manifest.permissions) ? manifest.permissions : [];
  const hostPermissions = Array.isArray(manifest.host_permissions) ? manifest.host_permissions : [];
  for (const p of permissions) {
    if (isHostPattern(p)) errors.push(`"${p}" is a host pattern and belongs in "host_permissions" in Manifest V3`);
    else if (!KNOWN_PERMISSIONS.has(p)) warnings.push(`Unknown permission "${p}"`);
    else if (HIGH_RISK_PERMISSIONS.has(p)) warnings.push(`High-risk permission "${p}" — make sure the extension really needs it`);
  }
  for (const h of hostPermissions) {
    if (BROAD_HOSTS.has(h)) warnings.push(`Broad host permission "${h}" grants access to every site`);
  }

  // --- Per-file checks
  for (const file of files) {
    if (file.encoding === 'base64') continue;
    if (/\.m?js$/.test(file.filename)) {
      try {
        // Parse only: the Script is constructed but never run.
        new vm.Script(file.content, { filename: file.filename });
      } catch (e) {
        if (/import|export/.test(e.message) && /Cannot use import|Unexpected token 'export'/.test(e.message)) {
          if (manifest.background?.type !== 'module' || file.filename !== manifest.background?.service_worker) {
            warnings.push(`${file.filename} uses ES module syntax; make sure it is loaded as a module`);
          }
        } else {
          errors.push(`${file.filename}: JavaScript syntax error — ${e.message}`);
        }
      }
    }
    if (file.filename.endsWith('.html')) {
      const scriptSrcs = [...file.content.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
      const links = [...file.content.matchAll(/<link\b[^>]*\bhref\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
      for (const src of scriptSrcs) {
        if (isRemote(src)) errors.push(`${file.filename} loads a remote script (${src}); Manifest V3 forbids remote code`);
        else if (!isIgnorableRef(src) && !has(resolveRef(file.filename, src))) errors.push(`${file.filename} references missing script "${src}"`);
      }
      for (const href of links) {
        if (isRemote(href) || isIgnorableRef(href)) continue;
        if (!has(resolveRef(file.filename, href))) errors.push(`${file.filename} references missing file "${href}"`);
      }
      // Inline scripts are blocked by the default extension CSP.
      const inline = [...file.content.matchAll(/<script\b(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi)].filter((m) => m[1].trim());
      if (inline.length) errors.push(`${file.filename} contains inline <script>; MV3 CSP blocks it — move code to a .js file`);
      if (/\son[a-z]+\s*=\s*["']/i.test(file.content)) {
        errors.push(`${file.filename} uses inline event handlers (e.g. onclick=); MV3 CSP blocks them — use addEventListener`);
      }
    }
  }

  return { errors, warnings, manifest };
};

module.exports = { validateExtension, KNOWN_PERMISSIONS, HIGH_RISK_PERMISSIONS, BROAD_HOSTS };
