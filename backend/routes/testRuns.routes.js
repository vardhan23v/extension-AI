const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { validateIdParam } = require('../middleware/validate.middleware');
const c = require('../controllers/testLab.controller');

// User routes
router.get('/', authMiddleware, c.listMine);
router.get('/:runId', validateIdParam('runId'), authMiddleware, c.getRun);

// Runner routes (GitHub Actions). Authenticated by HMAC signature, not a user session.
router.get('/:runId/bundle', c.runnerAuth('bundle'), c.runnerBundle);
router.post('/:runId/result', c.runnerAuth('result'), c.runnerResult);

module.exports = router;
