// GitHub integration: OAuth (state-protected), and exporting a project as a
// commit through the Git Data API. Never force-pushes; never writes to the
// default branch of a non-empty repository.
const crypto = require('crypto');
const { hmac } = require('./crypto.service');

const API = 'https://api.github.com';
const isConfigured = () => Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET && process.env.GITHUB_OAUTH_REDIRECT_URI);

class GitHubError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

// ---- OAuth -----------------------------------------------------------------

const STATE_TTL_MS = 10 * 60 * 1000;

// state = base64url(json).signature — binds the flow to a user, scope and expiry.
const createState = (userId, wantsPrivate) => {
  const payload = Buffer.from(JSON.stringify({ u: userId, p: wantsPrivate ? 1 : 0, e: Date.now() + STATE_TTL_MS, n: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  return `${payload}.${hmac(payload)}`;
};

const readState = (state) => {
  const [payload, sig] = String(state || '').split('.');
  if (!payload || !sig) return null;
  const expected = Buffer.from(hmac(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.e > Date.now() && typeof data.u === 'string' ? { userId: data.u, wantsPrivate: data.p === 1 } : null;
  } catch {
    return null;
  }
};

const authorizeUrl = (state, wantsPrivate) => {
  const q = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI,
    // Least privilege: public repos only unless the user asks for private ones.
    scope: wantsPrivate ? 'repo' : 'public_repo',
    state,
    allow_signup: 'false',
  });
  return `https://github.com/login/oauth/authorize?${q}`;
};

const exchangeCode = async (code) => {
  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: process.env.GITHUB_CLIENT_ID, client_secret: process.env.GITHUB_CLIENT_SECRET, code, redirect_uri: process.env.GITHUB_OAUTH_REDIRECT_URI }),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.access_token) throw new GitHubError(data.error_description || 'GitHub sign-in failed', 400);
  return { token: data.access_token, scope: data.scope || '' };
};

const revoke = async (token) => {
  const basic = Buffer.from(`${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`).toString('base64');
  await fetch(`${API}/applications/${process.env.GITHUB_CLIENT_ID}/grant`, {
    method: 'DELETE',
    headers: { Authorization: `Basic ${basic}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: token }),
  }).catch(() => {});
};

// ---- REST helper -------------------------------------------------------------

const gh = (token) => async (method, path, body) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || `HTTP ${res.status}`;
    if (res.status === 401) throw new GitHubError('Your GitHub connection has expired. Reconnect GitHub in Settings.', 401);
    if (res.status === 404) throw new GitHubError('Repository not found, or the connection has no access to it.', 404);
    throw new GitHubError(`GitHub: ${msg}`, res.status === 422 || res.status === 409 ? 409 : 502);
  }
  return data;
};

const getUser = async (token) => gh(token)('GET', '/user');

const listRepos = async (token) => {
  const repos = await gh(token)('GET', '/user/repos?affiliation=owner&sort=updated&per_page=50');
  return repos.map((r) => ({ fullName: r.full_name, private: r.private, defaultBranch: r.default_branch, updatedAt: r.updated_at, empty: r.size === 0 }));
};

// ---- Export --------------------------------------------------------------------

const REPO_NAME = /^[A-Za-z0-9._-]{1,100}$/;
const BRANCH_NAME = /^(?!.*\.\.)(?!\/)(?!.*\/$)[A-Za-z0-9._\/-]{1,100}$/;

/**
 * Commits `files` to GitHub.
 * target: { mode: 'new', name, private } | { mode: 'existing', repo: 'owner/name', branch?: string }
 * Existing non-empty repositories require a NEW branch name; the default branch is never touched.
 */
const exportFiles = async (token, { target, files, message, description }) => {
  const api = gh(token);
  let owner;
  let repo;
  let branch;
  let parentSha = null;
  let baseTree = null;
  let createdRepo = false;

  if (target.mode === 'new') {
    if (!REPO_NAME.test(target.name || '')) throw new GitHubError('Use letters, numbers, dots, dashes or underscores for the repository name.', 400);
    let created;
    try {
      created = await api('POST', '/user/repos', { name: target.name, private: Boolean(target.private), description: (description || '').slice(0, 300), auto_init: true });
    } catch (e) {
      if (e.status === 409) throw new GitHubError(`A repository named “${target.name}” already exists. Pick another name or export to it as an existing repository.`, 409);
      throw e;
    }
    [owner, repo] = created.full_name.split('/');
    branch = created.default_branch;
    createdRepo = true;
  } else {
    [owner, repo] = String(target.repo || '').split('/');
    if (!owner || !REPO_NAME.test(repo || '')) throw new GitHubError('Choose a repository.', 400);
    const info = await api('GET', `/repos/${owner}/${repo}`);
    if (!info.permissions?.push) throw new GitHubError('You don’t have write access to that repository.', 403);
    const branches = await api('GET', `/repos/${owner}/${repo}/branches?per_page=1`);
    const isEmpty = branches.length === 0;
    if (isEmpty) {
      // The Git Data API cannot write to an empty repo; create a first commit with the Contents API.
      await api('PUT', `/repos/${owner}/${repo}/contents/.gitkeep`, { message: 'Initialize repository', content: '' });
      branch = info.default_branch;
    } else {
      if (!target.branch || !BRANCH_NAME.test(target.branch)) {
        throw new GitHubError('This repository already has content. Choose a new branch name so nothing on the default branch is overwritten.', 400);
      }
      const existing = await api('GET', `/repos/${owner}/${repo}/branches/${encodeURIComponent(target.branch)}`).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (existing) throw new GitHubError(`Branch “${target.branch}” already exists. Choose a new branch name.`, 409);
      branch = target.branch;
      const base = await api('GET', `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(info.default_branch)}`);
      parentSha = base.object.sha;
    }
  }

  if (!parentSha) {
    const ref = await api('GET', `/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(branch)}`);
    parentSha = ref.object.sha;
  }
  const parent = await api('GET', `/repos/${owner}/${repo}/git/commits/${parentSha}`);
  baseTree = parent.tree.sha;

  const tree = [];
  for (const f of files) {
    const blob = await api('POST', `/repos/${owner}/${repo}/git/blobs`, {
      content: f.encoding === 'base64' ? f.content : Buffer.from(f.content, 'utf8').toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: f.filename, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await api('POST', `/repos/${owner}/${repo}/git/trees`, { base_tree: baseTree, tree });
  const commit = await api('POST', `/repos/${owner}/${repo}/git/commits`, { message, tree: newTree.sha, parents: [parentSha] });

  const isNewBranch = target.mode === 'existing' && target.branch && branch === target.branch && !createdRepo;
  if (isNewBranch) {
    await api('POST', `/repos/${owner}/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha: commit.sha });
  } else {
    // Fast-forward only (force: false): fails rather than overwriting history.
    await api('PATCH', `/repos/${owner}/${repo}/git/refs/heads/${encodeURIComponent(branch)}`, { sha: commit.sha, force: false });
  }

  return {
    repo: `${owner}/${repo}`,
    branch,
    commitSha: commit.sha,
    url: `https://github.com/${owner}/${repo}/tree/${encodeURIComponent(branch)}`,
    commitUrl: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
    createdRepo,
  };
};

// ---- README / commit message ------------------------------------------------------

const buildReadme = (ext, manifest) => {
  const perms = [...(manifest.permissions || []), ...(manifest.host_permissions || [])];
  const just = ext.store_assets?.kit?.permissionJustifications || {};
  return `# ${ext.title}

${ext.store_assets?.kit?.longDescription || ext.description || manifest.description || ext.prompt}

## Install (developer mode)

1. Download or clone this repository.
2. Open \`chrome://extensions\` and turn on **Developer mode**.
3. Click **Load unpacked** and select this folder.

## Permissions

${perms.length ? perms.map((p) => `- \`${p}\`${just[p] ? ` — ${just[p]}` : ''}`).join('\n') : 'This extension requests no permissions.'}

## Files

${ext.files.map((f) => `- \`${f.filename}\``).join('\n')}

---
Built with [Extensio AI](https://extension-ai-five.vercel.app). Manifest V3, version ${manifest.version || '1.0.0'}.
`;
};

module.exports = {
  isConfigured, createState, readState, authorizeUrl, exchangeCode, revoke, getUser, listRepos, exportFiles, buildReadme, GitHubError,
};
