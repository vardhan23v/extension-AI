const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const c = require('../controllers/github.controller');

router.get('/', authMiddleware, c.status);
router.post('/connect', authMiddleware, c.connect);
router.get('/callback', c.callback); // GitHub redirect; user identified by signed state
router.delete('/', authMiddleware, c.disconnect);
router.get('/repos', authMiddleware, c.repos);

module.exports = router;
