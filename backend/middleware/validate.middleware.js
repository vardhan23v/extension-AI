const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const validateIdParam = (...names) => (req, res, next) => {
  for (const name of names) {
    if (req.params[name] !== undefined && !UUID_RE.test(req.params[name])) {
      return res.status(400).json({ message: 'Invalid id' });
    }
  }
  next();
};

// Optional https URL (max 500 chars). Returns null for empty input; throws on invalid.
const parseOptionalHttpsUrl = (value, label) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 500) throw Object.assign(new Error(`${label} is invalid`), { status: 400 });
  let url;
  try {
    url = new URL(value);
  } catch {
    throw Object.assign(new Error(`${label} must be a valid URL`), { status: 400 });
  }
  if (url.protocol !== 'https:') throw Object.assign(new Error(`${label} must use https://`), { status: 400 });
  return url.toString();
};

const requireText = (value, label, max) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw Object.assign(new Error(`Please provide ${label}`), { status: 400 });
  }
  if (value.length > max) throw Object.assign(new Error(`${label} is too long (max ${max} characters)`), { status: 400 });
  return value.trim();
};

module.exports = { validateIdParam, parseOptionalHttpsUrl, requireText, UUID_RE };
