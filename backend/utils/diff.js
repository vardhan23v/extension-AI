// Summarizes which files an edit added, removed or changed.
const diffSummary = (before = [], after = []) => {
  const prev = new Map(before.map((f) => [f.filename, f.content]));
  const next = new Map(after.map((f) => [f.filename, f.content]));
  const added = [...next.keys()].filter((k) => !prev.has(k));
  const removed = [...prev.keys()].filter((k) => !next.has(k));
  const changed = [...next.keys()].filter((k) => prev.has(k) && prev.get(k) !== next.get(k));
  return { added, removed, changed };
};

module.exports = { diffSummary };
