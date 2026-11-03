// Models sometimes emit manifest.json as a JS-style object (unquoted or
// single-quoted keys, trailing commas, comments) or double-escaped. Repair
// those into strict JSON; anything else is left for the validator to report.

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:"'\\])\/\/[^\n]*/g, '$1');

const relaxedToJson = (s) =>
  stripComments(s)
    // 'single quoted' strings -> "double quoted"
    .replace(/'((?:[^'\\]|\\.)*)'/g, (_, body) => JSON.stringify(body.replace(/\\'/g, "'")))
    // unquoted keys -> quoted keys
    .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
    // trailing commas
    .replace(/,\s*([}\]])/g, '$1');

const tryParse = (s) => {
  try {
    const v = JSON.parse(s);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};

const repairManifestText = (text) => {
  if (tryParse(text)) return text;
  let s = String(text).trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '').trim();
  const candidates = [s];
  // Double-escaped: {\"name\":...}
  if (/\\"/.test(s)) {
    try {
      candidates.push(JSON.parse(`"${s.replace(/^"|"$/g, '')}"`));
    } catch {
      candidates.push(s.replace(/\\"/g, '"').replace(/\\n/g, '\n'));
    }
  }
  // Wrapped in a JSON string: "{...}"
  if (/^".*"$/s.test(s)) {
    try {
      candidates.push(JSON.parse(s));
    } catch {
      // ignore
    }
  }
  for (const c of candidates) {
    const parsed = tryParse(c) || tryParse(relaxedToJson(c));
    if (parsed) return JSON.stringify(parsed, null, 2);
  }
  return text;
};

const repairManifest = (files) =>
  files.map((f) => (f.filename === 'manifest.json' && f.encoding !== 'base64' ? { ...f, content: repairManifestText(f.content) } : f));

module.exports = { repairManifest, repairManifestText };
