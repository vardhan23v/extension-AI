const path = require('path');

const MAX_FILES = 60;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  '.json', '.js', '.mjs', '.html', '.css', '.md', '.txt', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp', '.ico',
]);

class SanitizeError extends Error {}

// Returns a safe, normalized, relative POSIX path or throws.
const normalizeFilename = (raw) => {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new SanitizeError('File is missing a filename');
  }
  const name = raw.trim();
  if (name.includes('\0') || name.includes('\\')) {
    throw new SanitizeError(`Invalid filename "${name}"`);
  }
  if (name.startsWith('/') || /^[a-zA-Z]:/.test(name)) {
    throw new SanitizeError(`Absolute paths are not allowed: "${name}"`);
  }
  const normalized = path.posix.normalize(name).replace(/^\.\//, '');
  if (normalized.split('/').some((seg) => seg === '..' || seg === '')) {
    throw new SanitizeError(`Path traversal is not allowed: "${name}"`);
  }
  if (normalized.length > 200) {
    throw new SanitizeError(`Filename too long: "${name.slice(0, 40)}..."`);
  }
  const ext = path.posix.extname(normalized).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new SanitizeError(`File type "${ext || '(none)'}" is not allowed: "${normalized}"`);
  }
  return normalized;
};

const sanitizeFiles = (files) => {
  if (!Array.isArray(files) || files.length === 0) {
    throw new SanitizeError('No files generated');
  }
  if (files.length > MAX_FILES) {
    throw new SanitizeError(`Too many files (${files.length}); maximum is ${MAX_FILES}`);
  }

  const seen = new Set();
  let total = 0;

  return files.map((file) => {
    const filename = normalizeFilename(file?.filename);
    if (seen.has(filename)) {
      throw new SanitizeError(`Duplicate file "${filename}"`);
    }
    seen.add(filename);

    const encoding = file.encoding === 'base64' ? 'base64' : undefined;
    let content = file.content;
    if (typeof content !== 'string') {
      content = JSON.stringify(content ?? '', null, 2);
    }

    const bytes = Buffer.byteLength(content, encoding === 'base64' ? 'base64' : 'utf8');
    if (bytes > MAX_FILE_BYTES) {
      throw new SanitizeError(`File "${filename}" is too large`);
    }
    total += bytes;
    if (total > MAX_TOTAL_BYTES) {
      throw new SanitizeError('Extension is too large');
    }

    if (!encoding) {
      // Block eval() — always dangerous
      if (/\beval\s*\(/.test(content)) {
        throw new SanitizeError(`Security violation in ${filename}: eval() is not allowed`);
      }

      // Block dangerous URI schemes in fetch calls
      const fetchMatches = content.match(/fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi) || [];
      for (const match of fetchMatches) {
        const url = match.match(/['"`]([^'"`]+)['"`]/)?.[1] || '';
        if (/^\s*(javascript|data):/i.test(url)) {
          throw new SanitizeError(`Security violation in ${filename}: fetch to dangerous scheme "${url}"`);
        }
      }
    }

    return encoding ? { filename, content, encoding } : { filename, content };
  });
};

// Safe value for a Content-Disposition filename.
const safeDownloadName = (title) =>
  (String(title || 'extension').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'extension');

module.exports = { sanitizeFiles, normalizeFilename, safeDownloadName, SanitizeError };
