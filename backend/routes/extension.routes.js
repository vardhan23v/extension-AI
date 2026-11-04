const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const { validateIdParam } = require('../middleware/validate.middleware');
const { aiLimiter } = require('../middleware/rateLimit.middleware');
const aiContext = require('../middleware/aiContext.middleware');
const c = require('../controllers/extension.controller');

const id = validateIdParam('id');

router.post('/generate', authMiddleware, aiContext, aiLimiter, c.generateExtension);
router.post('/generate/stream', authMiddleware, aiContext, aiLimiter, c.generateExtensionStream);
router.post('/enhance-prompt', authMiddleware, aiContext, aiLimiter, c.enhancePrompt);
router.post('/import', authMiddleware, express.raw({ type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'], limit: '5mb' }), c.importExtension);
router.get('/my', authMiddleware, c.getUserExtensions);
router.get('/gallery', c.getPublicGallery);
router.get('/shared/:id', id, c.getSharedExtension);
router.get('/download/:id', id, authMiddleware, c.downloadExtension);
router.post('/iterate/:id', id, authMiddleware, aiContext, aiLimiter, c.iterateExtension);

router.get('/:id', id, authMiddleware, c.getExtension);
router.patch('/:id', id, authMiddleware, c.updateMeta);
router.put('/:id/files', id, authMiddleware, c.saveFiles);
router.post('/:id/validate', id, authMiddleware, c.validateProject);
router.post('/:id/apply', id, authMiddleware, c.applyProposal);
router.post('/:id/duplicate', id, authMiddleware, c.duplicateExtension);
router.get('/:id/messages', id, authMiddleware, c.getMessages);
const lab = require('../controllers/testLab.controller');
router.post('/:id/test', id, authMiddleware, lab.startRun);
router.get('/:id/test-runs', id, authMiddleware, lab.listForExtension);
router.get('/:id/publishing', id, authMiddleware, c.getPublishing);
router.post('/:id/publishing/kit', id, authMiddleware, aiContext, aiLimiter, c.draftStoreKit);
router.put('/:id/publishing/kit', id, authMiddleware, c.saveStoreKit);
router.get('/:id/publishing/package', id, authMiddleware, c.downloadStorePackage);
router.delete('/:id', id, authMiddleware, c.deleteExtension);
router.get('/:id/versions', id, authMiddleware, c.listVersions);
router.post('/:id/versions/:versionId/restore', validateIdParam('id', 'versionId'), authMiddleware, c.restoreVersion);
router.post('/:id/publish', id, authMiddleware, c.togglePublish);
router.post('/:id/upvote', id, authMiddleware, c.upvoteExtension);
router.post('/:id/clone', id, authMiddleware, c.cloneExtension);
router.post('/:id/debug', id, authMiddleware, aiContext, aiLimiter, c.debugExtension);
router.post('/:id/audit', id, authMiddleware, aiContext, aiLimiter, c.auditExtension);

module.exports = router;
