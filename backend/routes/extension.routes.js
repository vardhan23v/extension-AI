const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const {
  generateExtension,
  downloadExtension,
  iterateExtension,
  getUserExtensions,
  deleteExtension,
  getPublicGallery,
  togglePublish,
  upvoteExtension,
  cloneExtension,
  debugExtension,
  auditExtension,
  enhancePrompt,
  getSharedExtension
} = require('../controllers/extension.controller');

router.post('/generate', authMiddleware, generateExtension);
router.get('/download/:id', authMiddleware, downloadExtension);
router.post('/iterate/:id', authMiddleware, iterateExtension);
router.get('/my', authMiddleware, getUserExtensions);
router.delete('/:id', authMiddleware, deleteExtension);

// New Routes
router.get('/gallery', getPublicGallery);
router.post('/enhance-prompt', authMiddleware, enhancePrompt);
router.get('/shared/:id', getSharedExtension);
router.post('/:id/publish', authMiddleware, togglePublish);
router.post('/:id/upvote', upvoteExtension);
router.post('/:id/clone', authMiddleware, cloneExtension);
router.post('/:id/debug', authMiddleware, debugExtension);
router.post('/:id/audit', authMiddleware, auditExtension);

module.exports = router;
