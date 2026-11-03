const repo = require('../repositories/extensions.repo');
const { generateExtension: runGeneration, editExtension, enhancePrompt: runEnhance, GenerationError } = require('../services/generation.service');
const { auditExtension: runAudit } = require('../services/security/audit.service');
const { createZipBuffer } = require('../services/zipper.service');
const { safeDownloadName } = require('../utils/sanitize');
const { parseOptionalHttpsUrl, requireText } = require('../middleware/validate.middleware');

const MAX_PROMPT = 4000;
const LANGUAGE_RE = /^[a-z]{2}(_[A-Z]{2})?$/;

const toClient = (ext) => ({
  id: ext.id,
  title: ext.title,
  prompt: ext.prompt,
  storeAssets: ext.store_assets || {},
  files: ext.files,
  isPublic: ext.is_public,
  iterationHistory: ext.iteration_history || [],
  createdAt: ext.created_at,
  updatedAt: ext.updated_at,
});

const generationMeta = (result) => ({
  provider: result.provider,
  summary: result.summary,
  warnings: result.validation.warnings,
  repaired: result.repaired,
});

const handleGenerationError = (err, res, next) => {
  if (err instanceof GenerationError) {
    return res.status(err.status).json({ message: err.message, ...(err.details || {}) });
  }
  return next(err);
};

const generateExtension = async (req, res, next) => {
  try {
    const prompt = requireText(req.body.prompt, 'a prompt', MAX_PROMPT);
    const monetizationLink = parseOptionalHttpsUrl(req.body.monetizationLink, 'Monetization link');
    const webhookUrl = parseOptionalHttpsUrl(req.body.webhookUrl, 'Webhook URL');
    const languages = Array.isArray(req.body.languages)
      ? req.body.languages.filter((l) => typeof l === 'string' && LANGUAGE_RE.test(l)).slice(0, 10)
      : [];

    const result = await runGeneration(prompt, { monetizationLink, webhookUrl, languages });

    const ext = await repo.create({
      user_id: req.user.userId,
      title: result.title,
      prompt,
      files: result.files,
      monetization_link: monetizationLink,
      store_assets: { description: result.storeDescription || '' },
      iteration_history: [{ prompt, timestamp: new Date().toISOString() }],
    });

    res.status(201).json({ success: true, extension: toClient(ext), generation: generationMeta(result) });
  } catch (err) {
    handleGenerationError(err, res, next);
  }
};

const downloadExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });

    const zip = await createZipBuffer(ext.files);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeDownloadName(ext.title)}-extension.zip"`,
      'Content-Length': zip.length,
    });
    res.send(zip);
  } catch (err) {
    next(err);
  }
};

// Shared flow for conversational edits and debug fixes: snapshot, edit, save.
const applyEdit = (kind) => async (req, res, next) => {
  try {
    const instruction =
      kind === 'debug'
        ? requireText(req.body.errorMessage, 'the error message', MAX_PROMPT)
        : requireText(req.body.prompt, 'a modification prompt', MAX_PROMPT);

    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });

    const result = await editExtension(ext, instruction, { kind });

    const historyPrompt = kind === 'debug' ? `DEBUG: ${instruction}` : instruction;
    await repo.addVersion(ext.id, ext.files, `Before: ${historyPrompt.slice(0, 200)}`);
    const updated = await repo.updateOwned(ext.id, req.user.userId, {
      title: result.title,
      files: result.files,
      iteration_history: [...(ext.iteration_history || []), { prompt: historyPrompt, timestamp: new Date().toISOString() }],
    });

    res.status(200).json({ success: true, extension: toClient(updated), generation: generationMeta(result) });
  } catch (err) {
    handleGenerationError(err, res, next);
  }
};

const getExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    res.json({ success: true, extension: toClient(ext) });
  } catch (err) {
    next(err);
  }
};

const getUserExtensions = async (req, res, next) => {
  try {
    const rows = await repo.listByUser(req.user.userId, { limit: 100 });
    res.status(200).json({
      success: true,
      extensions: rows.map((ext) => ({
        id: ext.id,
        title: ext.title,
        prompt: ext.prompt,
        fileCount: Array.isArray(ext.files) ? ext.files.length : 0,
        isPublic: ext.is_public,
        createdAt: ext.created_at,
        updatedAt: ext.updated_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const deleteExtension = async (req, res, next) => {
  try {
    const removed = await repo.removeOwned(req.params.id, req.user.userId);
    if (!removed) return res.status(404).json({ message: 'Extension not found' });
    res.status(200).json({ success: true, message: 'Extension deleted' });
  } catch (err) {
    next(err);
  }
};

const listVersions = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const versions = await repo.listVersions(ext.id);
    res.json({ success: true, versions: versions.map((v) => ({ id: v.id, note: v.note, createdAt: v.created_at })) });
  } catch (err) {
    next(err);
  }
};

const restoreVersion = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const version = await repo.findVersion(ext.id, req.params.versionId);
    if (!version) return res.status(404).json({ message: 'Version not found' });

    await repo.addVersion(ext.id, ext.files, 'Before restore');
    const updated = await repo.updateOwned(ext.id, req.user.userId, {
      files: version.files,
      iteration_history: [...(ext.iteration_history || []), { prompt: 'Restored an earlier version', timestamp: new Date().toISOString() }],
    });
    res.json({ success: true, extension: toClient(updated) });
  } catch (err) {
    next(err);
  }
};

const getPublicGallery = async (req, res, next) => {
  try {
    const rows = await repo.listPublic({ limit: 50 });
    res.status(200).json({
      success: true,
      extensions: rows.map((ext) => ({
        id: ext.id,
        title: ext.title,
        prompt: ext.prompt,
        storeAssets: ext.store_assets || {},
        upvotes: ext.upvotes,
        cloneCount: ext.clone_count,
        createdAt: ext.created_at,
      })),
    });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const updated = await repo.updateOwned(ext.id, req.user.userId, { is_public: !ext.is_public });
    res.status(200).json({ success: true, isPublic: updated.is_public });
  } catch (err) {
    next(err);
  }
};

const upvoteExtension = async (req, res, next) => {
  try {
    const count = await repo.upvote(req.params.id, req.user.userId);
    if (count === null || count === undefined) {
      const ext = await repo.findById(req.params.id);
      if (!ext || !ext.is_public) return res.status(404).json({ message: 'Extension not found' });
      return res.status(409).json({ message: 'You already upvoted this extension', upvotes: ext.upvotes });
    }
    res.status(200).json({ success: true, upvotes: count });
  } catch (err) {
    next(err);
  }
};

const cloneExtension = async (req, res, next) => {
  try {
    const source = await repo.findById(req.params.id);
    if (!source || !source.is_public) return res.status(404).json({ message: 'Extension not found' });

    const clone = await repo.create({
      user_id: req.user.userId,
      title: `${source.title} (Clone)`.slice(0, 200),
      prompt: source.prompt,
      files: source.files,
      store_assets: source.store_assets || {},
      iteration_history: [{ prompt: 'Cloned from Gallery', timestamp: new Date().toISOString() }],
    });
    await repo.incrementCloneCount(source.id);

    res.status(201).json({ success: true, extensionId: clone.id });
  } catch (err) {
    next(err);
  }
};

const auditExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const audit = await runAudit(ext.files);
    res.status(200).json({ success: true, audit });
  } catch (err) {
    next(err);
  }
};

const enhancePrompt = async (req, res, next) => {
  try {
    const prompt = requireText(req.body.prompt, 'a prompt to enhance', MAX_PROMPT);
    let enhancedPrompt;
    try {
      enhancedPrompt = await runEnhance(prompt);
    } catch (e) {
      console.error('Enhance prompt failed:', e.message);
      return res.status(502).json({ message: 'Failed to enhance prompt. Please try again.' });
    }
    res.status(200).json({ success: true, enhancedPrompt });
  } catch (err) {
    next(err);
  }
};

const getSharedExtension = async (req, res, next) => {
  try {
    const ext = await repo.findById(req.params.id);
    if (!ext || !ext.is_public) return res.status(404).json({ message: 'Extension not found or not public' });
    res.status(200).json({
      success: true,
      extension: {
        id: ext.id,
        title: ext.title,
        prompt: ext.prompt,
        storeAssets: ext.store_assets || {},
        files: ext.files,
        upvotes: ext.upvotes,
        cloneCount: ext.clone_count,
        createdAt: ext.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateExtension,
  downloadExtension,
  iterateExtension: applyEdit('edit'),
  debugExtension: applyEdit('debug'),
  getExtension,
  getUserExtensions,
  deleteExtension,
  listVersions,
  restoreVersion,
  getPublicGallery,
  togglePublish,
  upvoteExtension,
  cloneExtension,
  auditExtension,
  enhancePrompt,
  getSharedExtension,
};
