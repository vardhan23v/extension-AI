const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { getProfile, updateProfile } = require('../controllers/user.controller');

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);

// Bring-your-own AI keys. Keys are write-only: responses never include them.
const keys = require('../controllers/keys.controller');
router.get('/keys', authMiddleware, keys.listKeys);
router.put('/keys/:provider', authMiddleware, keys.saveKey);
router.post('/keys/:provider/test', authMiddleware, keys.testKey);
router.delete('/keys/:provider', authMiddleware, keys.deleteKey);
router.put('/settings', authMiddleware, keys.saveSettings);

module.exports = router;
