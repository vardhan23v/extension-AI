// Manual smoke test against the configured AI providers (uses real API credits).
require('dotenv').config();
const { generateExtension } = require('./services/generation.service');

(async () => {
  try {
    console.log('Testing generation...');
    const result = await generateExtension('Create a chrome extension that makes the background red');
    console.log('SUCCESS via', result.provider, JSON.stringify({ title: result.title, files: result.files.map((f) => f.filename), validation: result.validation }, null, 2));
  } catch (err) {
    console.error('FAILED:', err.message, err.details || '');
  }
})();
