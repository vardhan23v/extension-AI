// Manual smoke test of the crew against the configured AI providers (uses real API credits).
require('dotenv').config();
const { runCrew } = require('./services/crew/crew');

(async () => {
  const prompt = process.argv[2] || 'A popup with a button that changes the page background to a colour the user picks, remembering the last colour';
  const t = Date.now();
  try {
    const crew = await runCrew({
      kind: 'create',
      prompt,
      onEvent: (e) => e.type === 'agent:done' && console.log(`${e.role.padEnd(18)} ${e.status.padEnd(8)} ${String(e.ms).padStart(6)}ms  ${e.summary}`),
    });
    console.log(`\nTotal ${Date.now() - t}ms · ${crew.result.title} · ${crew.result.files.map((f) => f.filename).join(', ')}`);
    if (crew.plan) console.log('Plan permissions:', crew.plan.permissions.join(', ') || 'none');
  } catch (err) {
    console.error('FAILED after', Date.now() - t, 'ms:', err.message, err.details || '');
  }
})();
