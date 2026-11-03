const archiver = require('archiver');
const { normalizeFilename } = require('../utils/sanitize');

// Builds the ZIP entirely in memory — no temp folders, no host filesystem paths.
const createZipBuffer = (files) =>
  new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];
    archive.on('data', (chunk) => chunks.push(chunk));
    archive.on('error', reject);
    archive.on('end', () => resolve(Buffer.concat(chunks)));

    try {
      for (const file of files) {
        const name = normalizeFilename(file.filename);
        const data = Buffer.from(file.content, file.encoding === 'base64' ? 'base64' : 'utf8');
        archive.append(data, { name });
      }
    } catch (err) {
      archive.abort();
      reject(err);
      return;
    }
    archive.finalize();
  });

module.exports = { createZipBuffer };
