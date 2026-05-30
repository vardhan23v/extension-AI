const Extension = require('../models/Extension.model');
const { generateExtensionFiles } = require('../services/gemini.service');
const { sanitizeFiles } = require('../utils/sanitize');
const { createZip, cleanupZip } = require('../services/zipper.service');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const generateExtension = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a prompt' });
    }

    // Call Gemini AI
    let aiResponse;
    try {
      aiResponse = await generateExtensionFiles(prompt);
    } catch (aiError) {
      return res.status(400).json({ message: aiError.message });
    }

    // Sanitize files
    let sanitizedFiles;
    try {
      sanitizedFiles = sanitizeFiles(aiResponse.files);
    } catch (sanitizeError) {
      return res.status(400).json({ message: sanitizeError.message });
    }

    // Create zip
    const extensionId = uuidv4();
    let zipPath;
    try {
      zipPath = await createZip(extensionId, sanitizedFiles);
    } catch (zipError) {
      return res.status(500).json({ message: 'Failed to create zip file', error: zipError.message });
    }

    // Save to MongoDB
    const extension = new Extension({
      userId,
      title: aiResponse.title,
      prompt,
      files: sanitizedFiles,
      zipPath,
      iterationHistory: [{ prompt, timestamp: new Date() }],
    });

    await extension.save();

    res.status(201).json({
      success: true,
      extension: {
        id: extension._id,
        title: extension.title,
        files: sanitizedFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
        createdAt: extension.createdAt,
      },
    });
  } catch (error) {
    console.error('Generate extension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const downloadExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const extension = await Extension.findById(id);
    if (!extension) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    if (extension.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Recreate zip if needed
    let zipPath = extension.zipPath;
    if (!zipPath || !fs.existsSync(zipPath)) {
      zipPath = await createZip(id, extension.files);
      extension.zipPath = zipPath;
      await extension.save();
    }

    // Send file
    res.download(zipPath, `${extension.title}-extension.zip`, (err) => {
      if (err && err.code !== 'ERR_HTTP_HEADERS_SENT') {
        console.error('Download error:', err);
      }
    });
  } catch (error) {
    console.error('Download extension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const iterateExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { prompt: newPrompt } = req.body;
    const userId = req.user.userId;

    if (!newPrompt || newPrompt.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a modification prompt' });
    }

    const extension = await Extension.findById(id);
    if (!extension) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    if (extension.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Build combined prompt
    const combinedPrompt = `Original: "${extension.prompt}". Now modify it: "${newPrompt}"`;

    // Call Gemini AI with combined prompt
    let aiResponse;
    try {
      aiResponse = await generateExtensionFiles(combinedPrompt);
    } catch (aiError) {
      return res.status(400).json({ message: aiError.message });
    }

    // Sanitize files
    let sanitizedFiles;
    try {
      sanitizedFiles = sanitizeFiles(aiResponse.files);
    } catch (sanitizeError) {
      return res.status(400).json({ message: sanitizeError.message });
    }

    // Create new zip
    const newZipPath = await createZip(id, sanitizedFiles);

    // Clean up old zip
    if (extension.zipPath && fs.existsSync(extension.zipPath)) {
      cleanupZip(extension.zipPath);
    }

    // Update extension
    extension.title = aiResponse.title;
    extension.files = sanitizedFiles;
    extension.zipPath = newZipPath;
    extension.iterationHistory.push({ prompt: newPrompt, timestamp: new Date() });
    await extension.save();

    res.status(200).json({
      success: true,
      extension: {
        id: extension._id,
        title: extension.title,
        files: sanitizedFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
        updatedAt: extension.updatedAt,
      },
    });
  } catch (error) {
    console.error('Iterate extension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getUserExtensions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const extensions = await Extension.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      extensions: extensions.map((ext) => ({
        id: ext._id,
        title: ext.title,
        prompt: ext.prompt,
        fileCount: ext.files.length,
        createdAt: ext.createdAt,
        updatedAt: ext.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Get user extensions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const deleteExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const extension = await Extension.findById(id);
    if (!extension) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    if (extension.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Clean up zip file
    if (extension.zipPath && fs.existsSync(extension.zipPath)) {
      cleanupZip(extension.zipPath);
    }

    await Extension.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Extension deleted',
    });
  } catch (error) {
    console.error('Delete extension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  generateExtension,
  downloadExtension,
  iterateExtension,
  getUserExtensions,
  deleteExtension,
};
