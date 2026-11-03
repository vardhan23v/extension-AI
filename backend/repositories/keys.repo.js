const { getSupabase } = require('../services/supabase');
const { encrypt, decrypt } = require('../services/crypto.service');

const unwrap = ({ data, error }) => {
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

// Public view: provider + last 4 characters only.
const list = async (userId) =>
  unwrap(await getSupabase().from('provider_keys').select('provider, last4, created_at').eq('user_id', userId).order('provider'));

const save = async (userId, provider, plainKey) =>
  unwrap(
    await getSupabase()
      .from('provider_keys')
      .upsert({ user_id: userId, provider, encrypted_key: encrypt(plainKey), last4: plainKey.slice(-4), created_at: new Date().toISOString() })
      .select('provider, last4, created_at')
      .single()
  );

const remove = async (userId, provider) => {
  const rows = unwrap(await getSupabase().from('provider_keys').delete().eq('user_id', userId).eq('provider', provider).select('provider'));
  return rows.length > 0;
};

// Decrypted keys for use inside the API only: { groq?: string, gemini?: string, openrouter?: string }
const getDecrypted = async (userId) => {
  const rows = unwrap(await getSupabase().from('provider_keys').select('provider, encrypted_key').eq('user_id', userId));
  const out = {};
  for (const r of rows) {
    try {
      out[r.provider] = decrypt(r.encrypted_key);
    } catch {
      // A key that no longer decrypts (e.g. rotated server key) is ignored.
    }
  }
  return out;
};

const getSettings = async (userId) => {
  const row = unwrap(await getSupabase().from('user_settings').select('byok_only').eq('user_id', userId).maybeSingle());
  return { byokOnly: Boolean(row?.byok_only) };
};

const saveSettings = async (userId, { byokOnly }) =>
  unwrap(
    await getSupabase()
      .from('user_settings')
      .upsert({ user_id: userId, byok_only: Boolean(byokOnly), updated_at: new Date().toISOString() })
      .select('byok_only')
      .single()
  );

module.exports = { list, save, remove, getDecrypted, getSettings, saveSettings };
