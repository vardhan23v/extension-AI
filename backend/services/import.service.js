// Reads an uploaded extension ZIP into project files.
// Untrusted input: entry count, declared sizes and paths are all bounded, and
// each entry is inflated into a buffer of its declared size (so a lying header
// cannot allocate more) and verified against its CRC32.
const { inflateSync } = require('fflate');
const { sanitizeFiles, SanitizeError } = require('../utils/sanitize');

const MAX_ENTRIES = 200;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const BINARY = /\.(png|jpe?g|gif|webp|ico)$/i;
const TEXT = /\.(json|m?js|html|css|md|txt|svg)$/i;

class ImportError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

// Parses the central directory: [{ name, method, compSize, size, crc, localOffset }]
const readEntries = (buf) => {
  const sig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocd = buf.lastIndexOf(sig);
  if (eocd < 0 || eocd + 22 > buf.length) throw new ImportError('This is not a valid ZIP file');
  const count = buf.readUInt16LE(eocd + 10);
  const cdSize = buf.readUInt32LE(eocd + 12);
  let off = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || off === 0xffffffff) throw new ImportError('ZIP64 archives are not supported');
  if (count > MAX_ENTRIES) throw new ImportError(`Too many files in the ZIP (${count}; maximum ${MAX_ENTRIES})`);
  if (off + cdSize > buf.length) throw new ImportError('The ZIP file is corrupted');
  const entries = [];
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new ImportError('The ZIP file is corrupted');
    const flags = buf.readUInt16LE(off + 8);
    const method = buf.readUInt16LE(off + 10);
    const crc = buf.readUInt32LE(off + 16);
    const compSize = buf.readUInt32LE(off + 20);
    const size = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOffset = buf.readUInt32LE(off + 42);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    if (flags & 0x1) throw new ImportError('Encrypted ZIP files are not supported');
    entries.push({ name, method, crc, compSize, size, localOffset });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
};

const extract = (buf, e) => {
  if (e.localOffset + 30 > buf.length || buf.readUInt32LE(e.localOffset) !== 0x04034b50) throw new ImportError(`Corrupted entry: ${e.name}`);
  const start = e.localOffset + 30 + buf.readUInt16LE(e.localOffset + 26) + buf.readUInt16LE(e.localOffset + 28);
  const data = buf.subarray(start, start + e.compSize);
  if (data.length !== e.compSize) throw new ImportError(`Corrupted entry: ${e.name}`);
  let out;
  if (e.method === 0) out = data;
  else if (e.method === 8) {
    try {
      out = Buffer.from(inflateSync(data, { out: new Uint8Array(e.size) }));
    } catch {
      throw new ImportError(`File failed its integrity check: ${e.name}`);
    }
  }
  else throw new ImportError(`Unsupported compression in ${e.name}`);
  if (out.length !== e.size || crc32(out) !== e.crc) throw new ImportError(`File failed its integrity check: ${e.name}`);
  return out;
};

const isSkippable = (name) => {
  const parts = name.split('/');
  return name.endsWith('/') || parts.includes('__MACOSX') || parts.some((p) => p.startsWith('.')) || parts.includes('node_modules');
};

/**
 * @returns {{ files: Array<{filename, content, encoding?}>, skipped: string[] }}
 */
const readExtensionZip = (input) => {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input || []);
  if (buf.length < 22) throw new ImportError('Upload a ZIP file of your extension');
  const all = readEntries(buf);
  // An entry that escapes the archive root means the ZIP is malicious or broken: reject it outright.
  const escaping = all.find((e) => e.name.startsWith('/') || e.name.includes('\\') || e.name.split('/').includes('..'));
  if (escaping) throw new ImportError(`Unsafe path in ZIP: "${escaping.name}"`);
  const entries = all.filter((e) => !isSkippable(e.name));
  const declared = entries.reduce((n, e) => n + e.size, 0);
  if (declared > MAX_TOTAL_BYTES) throw new ImportError('The extension is too large to import (over 8 MB unpacked)');

  // Strip one shared top-level folder (e.g. "my-extension/manifest.json").
  const tops = new Set(entries.map((e) => e.name.split('/')[0]));
  const prefix = tops.size === 1 && entries.every((e) => e.name.includes('/')) ? `${[...tops][0]}/` : '';

  const files = [];
  const skipped = [];
  for (const e of entries) {
    const rel = e.name.slice(prefix.length);
    if (!BINARY.test(rel) && !TEXT.test(rel)) {
      skipped.push(rel);
      continue;
    }
    const data = extract(buf, e);
    files.push(BINARY.test(rel) ? { filename: rel, content: data.toString('base64'), encoding: 'base64' } : { filename: rel, content: data.toString('utf8') });
  }
  if (!files.some((f) => f.filename === 'manifest.json')) {
    throw new ImportError('No manifest.json found at the top level of the ZIP');
  }
  try {
    return { files: sanitizeFiles(files), skipped };
  } catch (err) {
    if (err instanceof SanitizeError) throw new ImportError(err.message);
    throw err;
  }
};

const titleFromManifest = (files) => {
  try {
    const m = JSON.parse(files.find((f) => f.filename === 'manifest.json').content);
    const name = typeof m.name === 'string' && !m.name.startsWith('__MSG_') ? m.name : null;
    return { title: (name || 'Imported extension').slice(0, 200), description: typeof m.description === 'string' && !m.description.startsWith('__MSG_') ? m.description.slice(0, 1000) : '' };
  } catch {
    return { title: 'Imported extension', description: '' };
  }
};

module.exports = { readExtensionZip, titleFromManifest, ImportError, MAX_ENTRIES };
