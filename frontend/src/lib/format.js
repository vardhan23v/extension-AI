const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const STEPS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export const timeAgo = (date) => {
  if (!date) return '';
  const secs = (new Date(date).getTime() - Date.now()) / 1000;
  for (const [unit, size] of STEPS) {
    if (Math.abs(secs) >= size) return rtf.format(Math.round(secs / size), unit);
  }
  return 'just now';
};

export const AUDIT_STATUS = {
  passed: { label: 'Passed checks', tone: 'success' },
  findings: { label: 'Findings', tone: 'warning' },
  incomplete: { label: 'Audit incomplete', tone: 'neutral' },
  failed: { label: 'Audit failed', tone: 'danger' },
};

export const PROJECT_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  ready: { label: 'Ready', tone: 'success' },
  archived: { label: 'Archived', tone: 'neutral' },
};

export const RUN_STATUS = {
  queued: { label: 'Queued', tone: 'neutral' },
  running: { label: 'Running', tone: 'info' },
  passed: { label: 'Passed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  error: { label: 'Could not run', tone: 'warning' },
};
