const zlib = require('zlib');

// Minimal dependency-free PNG encoder used to give every generated extension
// real icon files (Chrome refuses to load an unpacked extension whose manifest
// references missing icons).

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

const hashColor = (seed) => {
  let h = 0;
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  // HSL(hue, 65%, 50%) → RGB
  const s = 0.65, l = 0.5;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))));
  return [f(0), f(8), f(4)];
};

// Rounded square in the seed color with a white inner square.
const renderIconPng = (size, seed) => {
  const [r, g, b] = hashColor(seed);
  const radius = size * 0.22;
  const inner = [size * 0.34, size * 0.66];
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const cx = Math.min(Math.max(x + 0.5, radius), size - radius);
      const cy = Math.min(Math.max(y + 0.5, radius), size - radius);
      const inside = (x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= radius ** 2;
      const isInner = x >= inner[0] && x < inner[1] && y >= inner[0] && y < inner[1];
      const i = row + 1 + x * 4;
      if (!inside) continue; // transparent
      raw[i] = isInner ? 255 : r;
      raw[i + 1] = isInner ? 255 : g;
      raw[i + 2] = isInner ? 255 : b;
      raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
};

const collectIconRefs = (manifest) => {
  const refs = new Map(); // filename -> size
  const add = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [size, file] of Object.entries(obj)) {
      if (typeof file === 'string' && /\.png$/i.test(file)) refs.set(file.replace(/^\.?\//, ''), Number(size) || 128);
    }
  };
  add(manifest.icons);
  if (typeof manifest.action?.default_icon === 'object') add(manifest.action.default_icon);
  return refs;
};

// Adds generated PNGs for any icon the manifest references but the AI did not supply.
const injectMissingIcons = (files, seed) => {
  const manifestFile = files.find((f) => f.filename === 'manifest.json');
  if (!manifestFile) return files;
  let manifest;
  try {
    manifest = JSON.parse(manifestFile.content);
  } catch {
    return files;
  }
  const existing = new Set(files.map((f) => f.filename));
  const added = [];
  for (const [filename, size] of collectIconRefs(manifest)) {
    if (existing.has(filename)) continue;
    const px = Math.min(Math.max(size, 16), 128);
    added.push({ filename, content: renderIconPng(px, seed).toString('base64'), encoding: 'base64' });
  }
  return added.length ? [...files, ...added] : files;
};

module.exports = { injectMissingIcons, renderIconPng };
