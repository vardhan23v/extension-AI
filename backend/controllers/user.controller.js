const profiles = require('../repositories/profiles.repo');
const { requireText } = require('../middleware/validate.middleware');

const getProfile = async (req, res, next) => {
  try {
    const profile = await profiles.getProfile(req.user.userId);
    res.status(200).json({
      success: true,
      user: {
        id: req.user.userId,
        name: profile?.name || req.user.name,
        email: req.user.email,
        createdAt: profile?.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Email changes go through Supabase Auth (with confirmation), not this endpoint.
const updateProfile = async (req, res, next) => {
  try {
    const name = requireText(req.body.name, 'a name', 100);
    const profile = await profiles.updateName(req.user.userId, name);
    res.status(200).json({
      success: true,
      user: { id: req.user.userId, name: profile.name, email: req.user.email },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
