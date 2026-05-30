const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  generateExtension,
  downloadExtension,
  iterateExtension,
  getUserExtensions,
  deleteExtension,
} = require('../controllers/extension.controller');

router.post('/generate', authMiddleware, generateExtension);
router.get('/download/:id', authMiddleware, downloadExtension);
router.post('/iterate/:id', authMiddleware, iterateExtension);
router.get('/my', authMiddleware, getUserExtensions);
router.delete('/:id', authMiddleware, deleteExtension);

module.exports = router;
