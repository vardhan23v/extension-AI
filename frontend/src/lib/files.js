// Client-side mirror of backend/utils/sanitize.js normalizeFilename.
// The server re-validates everything; this only gives fast feedback.
const ALLOWED = ['.json', '.js', '.mjs', '.html', '.css', '.md', '.txt', '.svg'];

export const checkFilename = (raw, existing = []) => {
  const name = String(raw || '').trim().replace(/^\.\//, '');
  if (!name) return 'Enter a file name';
  if (name.includes('\\') || name.includes('\0')) return 'Backslashes are not allowed';
  if (name.startsWith('/')) return 'Use a relative path';
  if (name.split('/').some((s) => s === '..' || s === '')) return 'Invalid path';
  if (name.length > 200) return 'Name is too long';
  const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : '';
  if (!ALLOWED.includes(ext)) return `Allowed types: ${ALLOWED.join(' ')}`;
  if (existing.includes(name)) return 'A file with this name already exists';
  return null;
};

export const languageFor = (filename = '') => {
  if (filename.endsWith('.json')) return 'json';
  if (/\.m?js$/.test(filename)) return 'javascript';
  if (filename.endsWith('.html')) return 'html';
  if (filename.endsWith('.css')) return 'css';
  if (filename.endsWith('.md')) return 'markdown';
  if (filename.endsWith('.svg')) return 'xml';
  return 'plaintext';
};

export const isBinary = (file) => file?.encoding === 'base64';

// Builds a nested tree from flat paths: [{ name, path, children? }]
export const buildTree = (files) => {
  const root = [];
  for (const f of [...files].sort((a, b) => a.filename.localeCompare(b.filename))) {
    const parts = f.filename.split('/');
    let level = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join('/');
      let node = level.find((n) => n.name === part);
      if (!node) {
        node = i === parts.length - 1 ? { name: part, path, file: f } : { name: part, path, children: [] };
        level.push(node);
      }
      level = node.children || [];
    });
  }
  const sort = (nodes) =>
    nodes
      .sort((a, b) => (!!b.children - !!a.children) || a.name.localeCompare(b.name))
      .map((n) => (n.children ? { ...n, children: sort(n.children) } : n));
  return sort(root);
};
