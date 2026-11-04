const githubRepo = require('../repositories/github.repo');
const extRepo = require('../repositories/extensions.repo');
const github = require('../services/github.service');
const { isConfigured: cryptoReady } = require('../services/crypto.service');
const { completeWithFallback } = require('../services/ai/providers');

const ready = () => github.isConfigured() && cryptoReady();
const notReady = (res) => res.status(503).json({ message: 'GitHub export is not set up on this server yet.' });
const appUrl = () => process.env.APP_URL || new URL(process.env.GITHUB_OAUTH_REDIRECT_URI).origin;

const status = async (req, res, next) => {
  try {
    if (!ready()) return res.json({ success: true, available: false, connected: false });
    const conn = await githubRepo.get(req.user.userId);
    res.json({ success: true, available: true, connected: Boolean(conn), login: conn?.login || null, privateRepos: conn ? /\brepo\b/.test(conn.scope) : false });
  } catch (err) {
    next(err);
  }
};

const connect = async (req, res, next) => {
  try {
    if (!ready()) return notReady(res);
    const wantsPrivate = req.body?.private === true;
    res.json({ success: true, url: github.authorizeUrl(github.createState(req.user.userId, wantsPrivate), wantsPrivate) });
  } catch (err) {
    next(err);
  }
};

// GitHub redirects the browser here; there is no user session header, so the
// signed state identifies the user.
const callback = async (req, res) => {
  const back = (q) => res.redirect(302, `${appUrl()}/settings?${new URLSearchParams(q)}`);
  if (!ready()) return back({ github: 'error', reason: 'not-configured' });
  const state = github.readState(req.query.state);
  if (!state) return back({ github: 'error', reason: 'expired' });
  if (req.query.error || !req.query.code) return back({ github: 'error', reason: 'denied' });
  try {
    const { token, scope } = await github.exchangeCode(String(req.query.code));
    const user = await github.getUser(token);
    await githubRepo.save(state.userId, { token, login: user.login, scope });
    back({ github: 'connected' });
  } catch (err) {
    console.error('GitHub OAuth callback failed:', err.message);
    back({ github: 'error', reason: 'exchange' });
  }
};

const disconnect = async (req, res, next) => {
  try {
    if (!ready()) return notReady(res);
    const conn = await githubRepo.get(req.user.userId);
    if (conn) await github.revoke(conn.token);
    await githubRepo.remove(req.user.userId);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

const repos = async (req, res, next) => {
  try {
    if (!ready()) return notReady(res);
    const conn = await githubRepo.get(req.user.userId);
    if (!conn) return res.status(409).json({ message: 'Connect GitHub first.' });
    res.json({ success: true, repos: await github.listRepos(conn.token) });
  } catch (err) {
    next(err);
  }
};

const commitMessage = async (ext, isUpdate) => {
  const fallback = isUpdate ? `Update ${ext.title} from Extensio AI` : `Add ${ext.title} Chrome extension (Manifest V3)`;
  try {
    const { result } = await completeWithFallback(
      {
        system: 'Write one git commit message subject line (max 72 characters, imperative mood, no quotes, no trailing period) for exporting this Chrome extension project.',
        user: `Project: ${ext.title}\nPurpose: ${ext.description || ext.prompt}\nFiles: ${ext.files.map((f) => f.filename).join(', ')}`,
        maxTokens: 60,
        timeoutMs: 15000,
        models: { Groq: process.env.GROQ_FAST_MODEL || 'openai/gpt-oss-20b' },
      },
      (t) => {
        const line = t.trim().split('\n')[0].replace(/^["'`]|["'`.]$/g, '').slice(0, 72);
        if (line.length < 8) throw new Error('too short');
        return line;
      }
    );
    return result;
  } catch {
    return fallback;
  }
};

const exportProject = async (req, res, next) => {
  try {
    if (!ready()) return notReady(res);
    const conn = await githubRepo.get(req.user.userId);
    if (!conn) return res.status(409).json({ message: 'Connect GitHub first.' });
    const ext = await extRepo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });

    const target = req.body?.target || {};
    if (!['new', 'existing'].includes(target.mode)) return res.status(400).json({ message: 'Choose a new or existing repository.' });
    if (target.mode === 'new' && target.private && !/\brepo\b/.test(conn.scope)) {
      return res.status(403).json({ message: 'Your GitHub connection only allows public repositories. Reconnect with private access to create a private one.' });
    }

    let manifest = {};
    try {
      manifest = JSON.parse(ext.files.find((f) => f.filename === 'manifest.json')?.content || '{}');
    } catch {
      // invalid manifest: README still works
    }
    const files = ext.files.some((f) => f.filename.toLowerCase() === 'readme.md')
      ? ext.files
      : [...ext.files, { filename: 'README.md', content: github.buildReadme(ext, manifest) }];

    const result = await github.exportFiles(conn.token, {
      target: { mode: target.mode, name: target.name, private: target.private, repo: target.repo, branch: target.branch },
      files,
      message: await commitMessage(ext, target.mode === 'existing'),
      description: ext.description || manifest.description || '',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof github.GitHubError) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

module.exports = { status, connect, callback, disconnect, repos, exportProject };
