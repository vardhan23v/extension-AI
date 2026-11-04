const { getSupabase } = require('../services/supabase');
const { encrypt, decrypt } = require('../services/crypto.service');

const unwrap = ({ data, error }) => {
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

const get = async (userId) => {
  const row = unwrap(await getSupabase().from('github_connections').select('login, scope, created_at, encrypted_token').eq('user_id', userId).maybeSingle());
  if (!row) return null;
  let token = null;
  try {
    token = decrypt(row.encrypted_token);
  } catch {
    // unreadable (rotated key) → treat as disconnected
  }
  return token ? { login: row.login, scope: row.scope, createdAt: row.created_at, token } : null;
};

const save = async (userId, { token, login, scope }) =>
  unwrap(
    await getSupabase()
      .from('github_connections')
      .upsert({ user_id: userId, encrypted_token: encrypt(token), login, scope, created_at: new Date().toISOString() })
      .select('login, scope')
      .single()
  );

const remove = async (userId) => unwrap(await getSupabase().from('github_connections').delete().eq('user_id', userId).select('login'));

module.exports = { get, save, remove };
