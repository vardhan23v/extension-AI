const { getSupabase } = require('../services/supabase');

const unwrap = ({ data, error }) => {
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

const LIST_COLUMNS = 'id, extension_id, status, created_at, started_at, finished_at';

const create = async (row) => unwrap(await getSupabase().from('test_runs').insert(row).select(LIST_COLUMNS).single());

// Runner access (no user): full row including the files snapshot.
const findForRunner = async (id) => unwrap(await getSupabase().from('test_runs').select('*').eq('id', id).maybeSingle());

const findOwned = async (id, userId) =>
  unwrap(await getSupabase().from('test_runs').select(`${LIST_COLUMNS}, report`).eq('id', id).eq('user_id', userId).maybeSingle());

const listForExtension = async (extensionId, userId, limit = 10) =>
  unwrap(
    await getSupabase()
      .from('test_runs')
      .select(LIST_COLUMNS)
      .eq('extension_id', extensionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  );

const listForUser = async (userId, limit = 50) =>
  unwrap(
    await getSupabase()
      .from('test_runs')
      .select(`${LIST_COLUMNS}, extensions(title)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
  );

const update = async (id, patch) => unwrap(await getSupabase().from('test_runs').update(patch).eq('id', id).select(LIST_COLUMNS).single());

const countRecent = async (userId, sinceIso) => {
  const { count, error } = await getSupabase().from('test_runs').select('id', { head: true, count: 'exact' }).eq('user_id', userId).gte('created_at', sinceIso);
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return count || 0;
};

module.exports = { create, findForRunner, findOwned, listForExtension, listForUser, update, countRecent };
