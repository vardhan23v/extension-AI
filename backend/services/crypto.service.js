// AES-256-GCM encryption for user secrets (AI keys, OAuth tokens).
// The key comes from BYOK_ENCRYPTION_KEY (32 bytes, base64) and never leaves the server.
const crypto = require('crypto');

const getKey = () => {
  const raw = process.env.BYOK_ENCRYPTION_KEY;
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  return key.length === 32 ? key : null;
};

const isConfigured = () => Boolean(getKey());

const requireKey = () => {
  const key = getKey();
  if (!key) throw Object.assign(new Error('Encrypted key storage is not configured on the server'), { status: 503 });
  return key;
};

// Output: v1.<iv>.<tag>.<ciphertext> (base64url parts)
const encrypt = (plaintext) => {
  const key = requireKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64url'), cipher.getAuthTag().toString('base64url'), enc.toString('base64url')].join('.');
};

const decrypt = (payload) => {
  const key = requireKey();
  const [v, iv, tag, data] = String(payload).split('.');
  if (v !== 'v1' || !iv || !tag || !data) throw new Error('Unsupported ciphertext');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8');
};

module.exports = { encrypt, decrypt, isConfigured };
