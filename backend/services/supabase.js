const { createClient } = require('@supabase/supabase-js');

// Server-side client using the service-role key. It bypasses RLS, so every
// query that touches user data must filter by the authenticated user's id.
let client = null;

const getSupabase = () => {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error('Database is not configured');
    err.status = 503;
    throw err;
  }
  client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
};

module.exports = { getSupabase };
