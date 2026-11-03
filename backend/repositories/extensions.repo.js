const { getSupabase } = require('../services/supabase');

const MAX_VERSIONS = 20;

const unwrap = ({ data, error }) => {
  if (error) {
    const err = new Error(`Database error: ${error.message}`);
    err.status = 500;
    throw err;
  }
  return data;
};

const create = async (row) => unwrap(await getSupabase().from('extensions').insert(row).select().single());

const findById = async (id) =>
  unwrap(await getSupabase().from('extensions').select('*').eq('id', id).maybeSingle());

// Returns the row only if it belongs to userId.
const findOwned = async (id, userId) =>
  unwrap(await getSupabase().from('extensions').select('*').eq('id', id).eq('user_id', userId).maybeSingle());

const listByUser = async (userId, { limit = 50, offset = 0 } = {}) =>
  unwrap(
    await getSupabase()
      .from('extensions')
      .select('id, title, prompt, files, is_public, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  );

const listPublic = async ({ limit = 50, offset = 0 } = {}) =>
  unwrap(
    await getSupabase()
      .from('extensions')
      .select('id, title, prompt, store_assets, upvotes, clone_count, created_at')
      .eq('is_public', true)
      .order('upvotes', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
  );

const updateOwned = async (id, userId, patch) =>
  unwrap(await getSupabase().from('extensions').update(patch).eq('id', id).eq('user_id', userId).select().single());

const removeOwned = async (id, userId) => {
  const data = unwrap(await getSupabase().from('extensions').delete().eq('id', id).eq('user_id', userId).select('id'));
  return data.length > 0;
};

const addVersion = async (extensionId, files, note) => {
  const sb = getSupabase();
  unwrap(await sb.from('extension_versions').insert({ extension_id: extensionId, files, note }));
  // Keep only the newest MAX_VERSIONS snapshots.
  const old = unwrap(
    await sb
      .from('extension_versions')
      .select('id')
      .eq('extension_id', extensionId)
      .order('created_at', { ascending: false })
      .range(MAX_VERSIONS, MAX_VERSIONS + 50)
  );
  if (old.length) unwrap(await sb.from('extension_versions').delete().in('id', old.map((v) => v.id)));
};

const listVersions = async (extensionId) =>
  unwrap(
    await getSupabase()
      .from('extension_versions')
      .select('id, note, created_at')
      .eq('extension_id', extensionId)
      .order('created_at', { ascending: false })
  );

const findVersion = async (extensionId, versionId) =>
  unwrap(
    await getSupabase().from('extension_versions').select('*').eq('id', versionId).eq('extension_id', extensionId).maybeSingle()
  );

// Returns the new count, or null if the user already voted / extension not public.
const upvote = async (extensionId, userId) =>
  unwrap(await getSupabase().rpc('upvote_extension', { p_extension: extensionId, p_user: userId }));

const incrementCloneCount = async (extensionId) =>
  unwrap(await getSupabase().rpc('increment_clone_count', { p_extension: extensionId }));

const ping = async () => {
  const { error } = await getSupabase().from('extensions').select('id', { head: true, count: 'exact' }).limit(1);
  return !error;
};

module.exports = {
  create, findById, findOwned, listByUser, listPublic, updateOwned, removeOwned,
  addVersion, listVersions, findVersion, upvote, incrementCloneCount, ping,
};
