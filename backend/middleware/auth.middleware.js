const { getSupabase } = require('../services/supabase');

// Verifies a Supabase Auth access token and exposes the user as req.user.
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ message: 'Please sign in' });
  }
  try {
    const { data, error } = await getSupabase().auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.' });
    }
    req.user = { userId: data.user.id, email: data.user.email, name: data.user.user_metadata?.name || '' };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = authMiddleware;
