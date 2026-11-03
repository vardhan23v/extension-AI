const repo = require('../repositories/extensions.repo');
const messages = require('../repositories/messages.repo');
const { sanitizeFiles, SanitizeError } = require('../utils/sanitize');
const { injectMissingIcons } = require('../services/icons.service');
const { validateExtension } = require('../services/validator.service');
const { diffSummary } = require('../utils/diff');
const { enhancePrompt: runEnhance, GenerationError } = require('../services/generation.service');
const { runCrew } = require('../services/crew/crew');
const { readExtensionZip, titleFromManifest } = require('../services/import.service');
const publishing = require('../services/publishing.service');
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
  status: ext.status || 'draft',
  description: ext.description || '',
  lastAudit: ext.last_audit || null,
  iterationHistory: ext.iteration_history || [],
  createdAt: ext.created_at,
  updatedAt: ext.updated_at,
});

const generationMeta = (crew) => ({
  provider: crew.result.provider,
  summary: crew.result.summary,
  warnings: crew.result.validation.warnings,
  repaired: crew.result.repaired,
  plan: crew.plan,
  trace: crew.trace,
});

// Trace entries a client may echo back on apply; keep them small and well-formed.
const cleanTrace = (trace) =>
  Array.isArray(trace)
    ? trace
        .filter((t) => t && typeof t.agent === 'string')
        .slice(0, 8)
        .map((t) => ({ agent: t.agent.slice(0, 20), role: String(t.role || '').slice(0, 40), status: String(t.status || '').slice(0, 12), ms: Number(t.ms) || 0, summary: String(t.summary || '').slice(0, 200) }))
    : undefined;

const handleGenerationError = (err, res, next) => {
  if (err instanceof GenerationError) {
    return res.status(err.status).json({ message: err.message, ...(err.details || {}) });
  }
  return next(err);
};

// Validates the request, runs the crew and saves the project.
const createFromPrompt = async (req, onEvent) => {
  const prompt = requireText(req.body.prompt, 'a prompt', MAX_PROMPT);
  const monetizationLink = parseOptionalHttpsUrl(req.body.monetizationLink, 'Monetization link');
  const webhookUrl = parseOptionalHttpsUrl(req.body.webhookUrl, 'Webhook URL');
  const languages = Array.isArray(req.body.languages)
    ? req.body.languages.filter((l) => typeof l === 'string' && LANGUAGE_RE.test(l)).slice(0, 10)
    : [];

  const crew = await runCrew({ kind: 'create', prompt, options: { monetizationLink, webhookUrl, languages }, onEvent });
  const { result } = crew;

  const ext = await repo.create({
    user_id: req.user.userId,
    title: result.title,
    prompt,
    description: crew.plan?.summary || '',
    files: result.files,
    monetization_link: monetizationLink,
    store_assets: { description: result.storeDescription || '' },
    iteration_history: [{ prompt, timestamp: new Date().toISOString() }],
  });
  return { extension: toClient(ext), generation: generationMeta(crew) };
};

const generateExtension = async (req, res, next) => {
  try {
    const out = await createFromPrompt(req);
    res.status(201).json({ success: true, ...out });
  } catch (err) {
    handleGenerationError(err, res, next);
  }
};

// Same as generateExtension, but streams each agent's progress as Server-Sent Events.
const generateExtensionStream = async (req, res) => {
  res.status(200).set({
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  try {
    const out = await createFromPrompt(req, (e) => send(e.type, e));
    send('result', { success: true, ...out });
  } catch (err) {
    const status = err instanceof GenerationError ? err.status : err.status && err.status < 500 ? err.status : 500;
    if (status >= 500 && !(err instanceof GenerationError)) console.error('Stream generation error:', err.message);
    send('error', {
      status,
      message: status >= 500 && !(err instanceof GenerationError) ? 'Something went wrong. Please try again.' : err.message,
      ...(err instanceof GenerationError ? err.details || {} : {}),
    });
  }
  res.end();
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

// Validates client-supplied files with the same rules as AI output.
const prepareFiles = (files, seed) => {
  if (!Array.isArray(files)) throw Object.assign(new Error('files must be an array'), { status: 400 });
  try {
    const safe = injectMissingIcons(sanitizeFiles(files), seed);
    return { files: safe, validation: validateExtension(safe) };
  } catch (e) {
    if (e instanceof SanitizeError) throw Object.assign(new Error(e.message), { status: 400 });
    throw e;
  }
};

const logMessages = async (extensionId, entries) => {
  try {
    await messages.add(extensionId, entries);
  } catch (e) {
    // Conversation history is helpful but must not fail the edit itself.
    console.error('Failed to save conversation:', e.message);
  }
};

// Snapshot current files, save new ones, and append to iteration history.
const saveNewFiles = async (ext, userId, files, { historyPrompt, title, note }) => {
  await repo.addVersion(ext.id, ext.files, note);
  const patch = { files };
  if (title) patch.title = title;
  if (historyPrompt) {
    patch.iteration_history = [...(ext.iteration_history || []), { prompt: historyPrompt, timestamp: new Date().toISOString() }];
  }
  return repo.updateOwned(ext.id, userId, patch);
};

// Conversational edits and debug fixes. With { preview: true } the result is
// returned as a proposal and nothing is saved until POST /:id/apply.
const applyEdit = (kind) => async (req, res, next) => {
  try {
    const instruction =
      kind === 'debug'
        ? requireText(req.body.errorMessage, 'the error message', MAX_PROMPT)
        : requireText(req.body.prompt, 'a modification prompt', MAX_PROMPT);

    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });

    let history = [];
    try {
      history = (await messages.list(ext.id, { limit: 20 })) || [];
    } catch (e) {
      console.error('Loading conversation failed:', e.message);
    }
    const crew = await runCrew({ kind: kind === 'debug' ? 'debug' : 'edit', extension: ext, instruction, history });
    const { result } = crew;
    const changes = diffSummary(ext.files, result.files);
    const historyPrompt = kind === 'debug' ? `DEBUG: ${instruction}` : instruction;

    if (req.body.preview === true) {
      return res.status(200).json({
        success: true,
        proposal: { title: result.title, files: result.files, instruction: historyPrompt },
        changes,
        generation: generationMeta(crew),
      });
    }

    const updated = await saveNewFiles(ext, req.user.userId, result.files, {
      historyPrompt,
      title: result.title,
      note: `Before: ${historyPrompt.slice(0, 200)}`,
    });
    await logMessages(ext.id, [
      { role: 'user', content: historyPrompt },
      { role: 'assistant', content: result.summary || 'Applied the requested changes.', meta: { changes, provider: result.provider, trace: crew.trace } },
    ]);

    res.status(200).json({ success: true, extension: toClient(updated), changes, generation: generationMeta(crew) });
  } catch (err) {
    handleGenerationError(err, res, next);
  }
};

// Applies a previously previewed AI proposal (re-validated server-side).
const applyProposal = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const instruction = requireText(req.body.instruction, 'the instruction', MAX_PROMPT);
    const { files, validation } = prepareFiles(req.body.files, ext.title);
    if (validation.errors.length) {
      return res.status(422).json({ message: 'The proposed changes did not pass validation.', ...validation, manifest: undefined });
    }
    const changes = diffSummary(ext.files, files);
    const title = typeof req.body.title === 'string' && req.body.title.trim() ? req.body.title.trim().slice(0, 200) : undefined;
    const updated = await saveNewFiles(ext, req.user.userId, files, { historyPrompt: instruction, title, note: `Before: ${instruction.slice(0, 200)}` });
    const summary = typeof req.body.summary === 'string' ? req.body.summary.slice(0, 2000) : '';
    await logMessages(ext.id, [
      { role: 'user', content: instruction },
      { role: 'assistant', content: summary || 'Applied the proposed changes.', meta: { changes, trace: cleanTrace(req.body.trace) } },
    ]);
    res.json({ success: true, extension: toClient(updated), changes });
  } catch (err) {
    next(err);
  }
};

// Manual edits from the code editor. Validation problems are reported but do
// not block saving, since work in progress is often temporarily invalid.
const saveFiles = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const { files, validation } = prepareFiles(req.body.files, ext.title);
    const changes = diffSummary(ext.files, files);
    if (!changes.added.length && !changes.removed.length && !changes.changed.length) {
      return res.json({ success: true, extension: toClient(ext), validation: { errors: validation.errors, warnings: validation.warnings }, changes });
    }
    // Snapshot at most once every 10 minutes for autosave bursts.
    const versions = await repo.listVersions(ext.id);
    const recent = versions[0] && Date.now() - new Date(versions[0].created_at).getTime() < 10 * 60 * 1000;
    if (!recent) await repo.addVersion(ext.id, ext.files, 'Before manual edits');
    const updated = await repo.updateOwned(ext.id, req.user.userId, { files });
    res.json({ success: true, extension: toClient(updated), validation: { errors: validation.errors, warnings: validation.warnings }, changes });
  } catch (err) {
    next(err);
  }
};

const validateProject = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const { errors, warnings } = validateExtension(ext.files);
    res.json({ success: true, validation: { errors, warnings } });
  } catch (err) {
    next(err);
  }
};

const STATUSES = new Set(['draft', 'ready', 'archived']);

const updateMeta = async (req, res, next) => {
  try {
    const patch = {};
    if (req.body.title !== undefined) patch.title = requireText(req.body.title, 'a title', 200);
    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string' || req.body.description.length > 1000) {
        return res.status(400).json({ message: 'Description must be at most 1000 characters' });
      }
      patch.description = req.body.description.trim();
    }
    if (req.body.status !== undefined) {
      if (!STATUSES.has(req.body.status)) return res.status(400).json({ message: 'Invalid status' });
      patch.status = req.body.status;
    }
    if (!Object.keys(patch).length) return res.status(400).json({ message: 'Nothing to update' });
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const updated = await repo.updateOwned(ext.id, req.user.userId, patch);
    res.json({ success: true, extension: toClient(updated) });
  } catch (err) {
    next(err);
  }
};

const duplicateExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const copy = await repo.create({
      user_id: req.user.userId,
      title: `${ext.title} (Copy)`.slice(0, 200),
      prompt: ext.prompt,
      description: ext.description || '',
      files: ext.files,
      store_assets: ext.store_assets || {},
      monetization_link: ext.monetization_link,
      iteration_history: [{ prompt: `Duplicated from "${ext.title}"`, timestamp: new Date().toISOString() }],
    });
    res.status(201).json({ success: true, extension: toClient(copy) });
  } catch (err) {
    next(err);
  }
};

const getMessages = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const rows = await messages.list(ext.id);
    res.json({
      success: true,
      messages: rows.map((m) => ({ id: m.id, role: m.role, content: m.content, meta: m.meta, createdAt: m.created_at })),
    });
  } catch (err) {
    next(err);
  }
};

const getExtension = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const { errors, warnings } = validateExtension(ext.files);
    res.json({ success: true, extension: toClient(ext), validation: { errors, warnings } });
  } catch (err) {
    next(err);
  }
};

const getUserExtensions = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
    const offset = Math.max(parseInt(req.query.offset, 10) || 0, 0);
    const q = typeof req.query.q === 'string' ? req.query.q.slice(0, 100) : undefined;
    const status = STATUSES.has(req.query.status) ? req.query.status : undefined;
    const { rows, total } = await repo.listByUser(req.user.userId, { limit, offset, q, status });
    res.status(200).json({
      success: true,
      total,
      extensions: rows.map((ext) => ({
        id: ext.id,
        title: ext.title,
        prompt: ext.prompt,
        description: ext.description || '',
        status: ext.status || 'draft',
        fileCount: Array.isArray(ext.files) ? ext.files.length : 0,
        isPublic: ext.is_public,
        auditStatus: ext.last_audit?.status || null,
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
    const lastAudit = { status: audit.status, counts: audit.counts, at: new Date().toISOString() };
    await repo.updateOwned(ext.id, req.user.userId, { last_audit: lastAudit }).catch((e) => console.error('Saving audit failed:', e.message));
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

// Imports an existing extension from an uploaded ZIP (raw application/zip body).
const importExtension = async (req, res, next) => {
  try {
    const { files: raw, skipped } = readExtensionZip(req.body);
    const { title, description } = titleFromManifest(raw);
    const { files, validation } = prepareFiles(raw, title);
    const ext = await repo.create({
      user_id: req.user.userId,
      title,
      description,
      prompt: `Imported: ${title}`,
      files,
      iteration_history: [{ prompt: 'Imported from ZIP', timestamp: new Date().toISOString() }],
    });
    res.status(201).json({ success: true, extension: toClient(ext), validation: { errors: validation.errors, warnings: validation.warnings }, skipped });
  } catch (err) {
    next(err);
  }
};

const permissionsOf = (files) => {
  const m = publishing.readManifest(files);
  return [...(m.permissions || []), ...(m.host_permissions || [])];
};

const getPublishing = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const assets = ext.store_assets || {};
    res.json({ success: true, checklist: publishing.buildChecklist(ext.files, assets), kit: assets.kit || null, permissions: permissionsOf(ext.files) });
  } catch (err) {
    next(err);
  }
};

const draftStoreKit = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    let kit;
    try {
      kit = await publishing.draftStoreKit(ext);
    } catch (e) {
      console.error('Store kit draft failed:', e.message);
      return res.status(502).json({ message: 'Could not draft the store listing right now. You can still write it yourself.' });
    }
    const assets = { ...(ext.store_assets || {}), kit, description: kit.shortDescription };
    const updated = await repo.updateOwned(ext.id, req.user.userId, { store_assets: assets });
    res.json({ success: true, kit, checklist: publishing.buildChecklist(updated.files, assets), permissions: permissionsOf(updated.files) });
  } catch (err) {
    next(err);
  }
};

const saveStoreKit = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    let kit;
    try {
      kit = publishing.cleanKit(req.body.kit, permissionsOf(ext.files));
    } catch {
      return res.status(400).json({ message: 'Write a store description before saving.' });
    }
    const assets = { ...(ext.store_assets || {}), kit, description: kit.shortDescription };
    const updated = await repo.updateOwned(ext.id, req.user.userId, { store_assets: assets });
    res.json({ success: true, kit, checklist: publishing.buildChecklist(updated.files, assets) });
  } catch (err) {
    next(err);
  }
};

// ZIP with the extension in extension/ plus the listing and privacy policy.
const downloadStorePackage = async (req, res, next) => {
  try {
    const ext = await repo.findOwned(req.params.id, req.user.userId);
    if (!ext) return res.status(404).json({ message: 'Extension not found' });
    const kit = ext.store_assets?.kit;
    if (!kit) return res.status(409).json({ message: 'Create the store kit first.' });
    const files = [
      ...ext.files.map((f) => ({ ...f, filename: `extension/${f.filename}` })),
      { filename: 'store-listing.md', content: publishing.listingMarkdown(ext, kit) },
      { filename: 'privacy-policy.md', content: kit.privacyPolicy || '# Privacy policy\n\nThis extension does not collect, store or transmit personal data.\n' },
    ];
    const zip = await createZipBuffer(files);
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${safeDownloadName(ext.title)}-store-package.zip"`,
      'Content-Length': zip.length,
    });
    res.send(zip);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  importExtension,
  getPublishing,
  draftStoreKit,
  saveStoreKit,
  downloadStorePackage,
  generateExtension,
  generateExtensionStream,
  downloadExtension,
  iterateExtension: applyEdit('edit'),
  applyProposal,
  saveFiles,
  validateProject,
  updateMeta,
  duplicateExtension,
  getMessages,
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
