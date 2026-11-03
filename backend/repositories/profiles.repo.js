const { getSupabase } = require('../services/supabase');

const getProfile = async (userId) => {
  const { data, error } = await getSupabase().from('profiles').select('id, name, created_at').eq('id', userId).maybeSingle();
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

const updateName = async (userId, name) => {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert({ id: userId, name })
    .select('id, name, created_at')
    .single();
  if (error) throw Object.assign(new Error(`Database error: ${error.message}`), { status: 500 });
  return data;
};

module.exports = { getProfile, updateName };
