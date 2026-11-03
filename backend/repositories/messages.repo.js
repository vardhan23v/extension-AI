const { getSupabase } = require('../services/supabase');

const unwrap = ({ data, error }) => {
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

const MAX_CONTENT = 8000;

const add = async (extensionId, messages) =>
  unwrap(
    await getSupabase()
      .from('conversations')
      .insert(messages.map((m) => ({ extension_id: extensionId, role: m.role, content: String(m.content).slice(0, MAX_CONTENT), meta: m.meta || {} })))
      .select()
  );

const list = async (extensionId, { limit = 200 } = {}) =>
  unwrap(
    await getSupabase()
      .from('conversations')
      .select('id, role, content, meta, created_at')
      .eq('extension_id', extensionId)
      .order('created_at', { ascending: true })
      .limit(limit)
  );

module.exports = { add, list };
