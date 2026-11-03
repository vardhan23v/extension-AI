const zlib = require('zlib');
const { renderIconPng, injectMissingIcons } = require('../services/icons.service');
const { createZipBuffer } = require('../services/zipper.service');
const { validFiles } = require('./fixtures');

test('renderIconPng produces a PNG of the right size', () => {
  const png = renderIconPng(48, 'x');
  expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  expect(png.readUInt32BE(16)).toBe(48);
  expect(png.readUInt32BE(20)).toBe(48);
});

test('injectMissingIcons adds exactly the referenced icons', () => {
  const out = injectMissingIcons(validFiles(), 'x');
  expect(out.filter((f) => f.encoding === 'base64').map((f) => f.filename).sort()).toEqual(['icon128.png', 'icon16.png', 'icon48.png']);
});

// Reads central-directory entry names from a ZIP buffer.
const zipEntries = (buf) => {
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i++) {
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const name = buf.toString('utf8', off + 46, off + 46 + nameLen);
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const dataStart = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    entries.push({ name, data: method === 8 ? zlib.inflateRawSync(raw) : raw });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
};

test('createZipBuffer contains every file with identical content', async () => {
  const files = injectMissingIcons(validFiles(), 'x');
  const entries = zipEntries(await createZipBuffer(files));
  expect(entries.map((e) => e.name).sort()).toEqual(files.map((f) => f.filename).sort());
  const manifest = entries.find((e) => e.name === 'manifest.json');
  expect(manifest.data.toString()).toBe(files[0].content);
  const icon = entries.find((e) => e.name === 'icon16.png');
  expect(icon.data.equals(Buffer.from(files.find((f) => f.filename === 'icon16.png').content, 'base64'))).toBe(true);
});

test('createZipBuffer rejects traversal names', async () => {
  await expect(createZipBuffer([{ filename: '../evil.js', content: 'x' }])).rejects.toThrow(/traversal/);
});
