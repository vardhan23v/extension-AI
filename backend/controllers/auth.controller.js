// Sign-up and sign-in are handled by Supabase Auth in the browser.
// The backend only exposes the current user's identity.

const me = (req, res) => {
  res.status(200).json({
    success: true,
    user: { id: req.user.userId, name: req.user.name, email: req.user.email },
  });
};

const movedToSupabase = (req, res) => {
  res.status(410).json({ message: 'Sign-in moved to Supabase Auth. Please refresh the app.' });
};

module.exports = { me, register: movedToSupabase, login: movedToSupabase };
