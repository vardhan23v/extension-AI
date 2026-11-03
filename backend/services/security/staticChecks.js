const { HIGH_RISK_PERMISSIONS, BROAD_HOSTS } = require('../validator.service');

// Deterministic security checks. Each finding:
// { id, severity: 'critical'|'high'|'medium'|'low'|'info', file, message, recommendation }

const SECRET_PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'OpenAI-style secret key', re: /\bsk-[A-Za-z0-9_-]{20,}/ },
  { name: 'Groq API key', re: /\bgsk_[A-Za-z0-9]{20,}/ },
  { name: 'GitHub token', re: /\bgh[pousr]_[A-Za-z0-9]{30,}/ },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'Stripe secret key', re: /\bsk_live_[A-Za-z0-9]{20,}/ },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
];

const lineOf = (content, index) => content.slice(0, index).split('\n').length;

const runStaticChecks = (files) => {
  const findings = [];
  const add = (f) => findings.push(f);

  const manifestFile = files.find((f) => f.filename === 'manifest.json');
  let manifest = null;
  try {
    manifest = manifestFile ? JSON.parse(manifestFile.content) : null;
  } catch {
    add({ id: 'manifest-invalid', severity: 'high', file: 'manifest.json', message: 'manifest.json is not valid JSON', recommendation: 'Fix the JSON syntax.' });
  }
  if (!manifestFile) {
    add({ id: 'manifest-missing', severity: 'high', file: null, message: 'manifest.json is missing', recommendation: 'Add a Manifest V3 manifest.json.' });
  }

  if (manifest) {
    if (manifest.manifest_version !== 3) {
      add({ id: 'mv-not-3', severity: 'high', file: 'manifest.json', message: 'Extension is not Manifest V3', recommendation: 'Set "manifest_version": 3; Chrome no longer accepts MV2.' });
    }
    for (const p of manifest.permissions || []) {
      if (HIGH_RISK_PERMISSIONS.has(p)) {
        add({ id: 'perm-high-risk', severity: 'medium', file: 'manifest.json', message: `High-risk permission "${p}"`, recommendation: 'Remove it unless a feature strictly requires it, and explain why in the store listing.' });
      }
      if (BROAD_HOSTS.has(p)) {
        add({ id: 'perm-host-in-permissions', severity: 'medium', file: 'manifest.json', message: `Host pattern "${p}" listed in "permissions"`, recommendation: 'Move host patterns to "host_permissions" and narrow them.' });
      }
    }
    const hosts = [...(manifest.host_permissions || []), ...(manifest.content_scripts || []).flatMap((c) => c.matches || [])];
    for (const h of new Set(hosts)) {
      if (BROAD_HOSTS.has(h)) {
        add({ id: 'host-broad', severity: 'high', file: 'manifest.json', message: `Access to all websites via "${h}"`, recommendation: 'Limit to the specific sites the extension needs, or use "activeTab".' });
      }
    }
    const csp = manifest.content_security_policy;
    const cspText = typeof csp === 'string' ? csp : csp?.extension_pages || '';
    if (/unsafe-eval|unsafe-inline/.test(cspText)) {
      add({ id: 'csp-unsafe', severity: 'high', file: 'manifest.json', message: 'Content Security Policy allows unsafe-eval or unsafe-inline', recommendation: 'Remove unsafe-* sources; MV3 rejects them for extension pages.' });
    }
    if (/https?:\/\//.test(cspText)) {
      add({ id: 'csp-remote', severity: 'high', file: 'manifest.json', message: 'Content Security Policy allows remote script sources', recommendation: 'MV3 forbids remotely hosted code; package all scripts.' });
    }
    if (manifest.externally_connectable) {
      const matches = manifest.externally_connectable.matches || [];
      const sev = matches.some((m) => /\*:\/\/\*\/|<all_urls>|\*\.\*/.test(m)) || manifest.externally_connectable.ids?.includes('*') ? 'high' : 'low';
      add({ id: 'externally-connectable', severity: sev, file: 'manifest.json', message: 'Extension accepts messages from web pages or other extensions (externally_connectable)', recommendation: 'Restrict matches/ids and validate every external message sender.' });
    }
    const war = manifest.web_accessible_resources || [];
    if (war.some((r) => (r.matches || []).some((m) => BROAD_HOSTS.has(m)))) {
      add({ id: 'war-broad', severity: 'low', file: 'manifest.json', message: 'Web-accessible resources exposed to all sites', recommendation: 'Expose resources only to sites that need them (fingerprinting risk).' });
    }
  }

  for (const file of files) {
    if (file.encoding === 'base64') continue;
    const c = file.content;
    const isJs = /\.m?js$/.test(file.filename);
    const isHtml = file.filename.endsWith('.html');

    for (const { name, re } of SECRET_PATTERNS) {
      const m = c.match(re);
      if (m) add({ id: 'secret', severity: 'critical', file: file.filename, line: lineOf(c, m.index), message: `Possible hard-coded ${name}`, recommendation: 'Never ship secrets in an extension — anyone can unzip it. Move calls behind your own server.' });
    }

    if (isJs) {
      const patterns = [
        { id: 'eval', re: /\beval\s*\(/, severity: 'critical', message: 'eval() executes arbitrary code', rec: 'Remove eval; MV3 CSP blocks it anyway.' },
        { id: 'new-function', re: /\bnew\s+Function\s*\(/, severity: 'critical', message: 'new Function() executes arbitrary code', rec: 'Replace with regular functions.' },
        { id: 'string-timer', re: /\bset(?:Timeout|Interval)\s*\(\s*['"`]/, severity: 'high', message: 'setTimeout/setInterval with a string argument evaluates code', rec: 'Pass a function instead of a string.' },
        { id: 'inner-html', re: /\.(?:innerHTML|outerHTML)\s*\+?=\s*(?!\s*['"`][^'"`$]*['"`]\s*;?$)/m, severity: 'medium', message: 'innerHTML/outerHTML assigned a dynamic value (XSS risk)', rec: 'Use textContent or build DOM nodes; sanitize any HTML you must insert.' },
        { id: 'insert-adjacent', re: /\.insertAdjacentHTML\s*\(/, severity: 'medium', message: 'insertAdjacentHTML can inject untrusted markup', rec: 'Use DOM APIs or sanitize input.' },
        { id: 'document-write', re: /\bdocument\.write(?:ln)?\s*\(/, severity: 'medium', message: 'document.write is unsafe and blocked in many contexts', rec: 'Use DOM APIs.' },
        { id: 'external-message', re: /\bonMessageExternal\b|\bonConnectExternal\b/, severity: 'medium', message: 'Listens for messages from outside the extension', rec: 'Verify sender.id / sender.origin before acting on messages.' },
        { id: 'remote-import', re: /\bimport(?:Scripts)?\s*\(\s*['"`]https?:/, severity: 'critical', message: 'Loads remote code at runtime', rec: 'MV3 forbids remotely hosted code; bundle the module.' },
      ];
      for (const p of patterns) {
        const m = c.match(p.re);
        if (m) add({ id: p.id, severity: p.severity, file: file.filename, line: lineOf(c, m.index), message: p.message, recommendation: p.rec });
      }
      if (/\bonMessage\.addListener\b/.test(c) && /\b(?:executeScript|tabs\.update|fetch)\b/.test(c) && !/sender\.(?:id|origin|url|tab)/.test(c)) {
        add({ id: 'message-no-sender-check', severity: 'low', file: file.filename, message: 'Message handler performs privileged actions without checking the sender', recommendation: 'Check sender before acting on messages from content scripts.' });
      }
      if (/chrome\.storage\.(?:local|sync)\.set\s*\([^)]*(password|token|secret|apikey|api_key)/i.test(c)) {
        add({ id: 'sensitive-storage', severity: 'medium', file: file.filename, message: 'Sensitive data appears to be stored in chrome.storage (unencrypted)', recommendation: 'Avoid persisting secrets; use chrome.storage.session for short-lived data.' });
      }
      const urls = [...c.matchAll(/(?:fetch|XMLHttpRequest[^;]*open)\s*\(\s*['"`](http:\/\/[^'"`\s]+)/g)];
      for (const m of urls) {
        add({ id: 'insecure-http', severity: 'medium', file: file.filename, line: lineOf(c, m.index), message: `Request over plain HTTP (${m[1].slice(0, 60)})`, recommendation: 'Use HTTPS.' });
      }
    }

    if (isHtml) {
      const remote = c.match(/<script\b[^>]*\bsrc\s*=\s*["'](https?:)?\/\//i);
      if (remote) add({ id: 'remote-script', severity: 'critical', file: file.filename, line: lineOf(c, remote.index), message: 'Loads a remote script', recommendation: 'MV3 forbids remotely hosted code; package the script.' });
      const inline = c.match(/\son[a-z]+\s*=\s*["']/i);
      if (inline) add({ id: 'inline-handler', severity: 'low', file: file.filename, line: lineOf(c, inline.index), message: 'Inline event handler (blocked by MV3 CSP)', recommendation: 'Use addEventListener in a .js file.' });
    }
  }

  return findings;
};

module.exports = { runStaticChecks };
