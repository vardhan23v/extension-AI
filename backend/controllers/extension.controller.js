const Extension = require('../models/Extension.model');
const { generateExtensionFiles, auditExtensionCode } = require('../services/gemini.service');
const { sanitizeFiles } = require('../utils/sanitize');
const { createZip, cleanupZip } = require('../services/zipper.service');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const generateExtension = async (req, res) => {
  try {
    const { prompt, monetizationLink, webhookUrl, languages } = req.body;
    const userId = req.user.userId;

    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a prompt' });
    }

    // Call Gemini AI
    let aiResponse;
    try {
      aiResponse = await generateExtensionFiles(prompt, { monetizationLink, webhookUrl, languages });
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

    // Generate Store Assets URLs using Pollinations.ai (free, open API)
    const encodedTitle = encodeURIComponent(aiResponse.title);
    const logoUrl = `https://image.pollinations.ai/prompt/Flat%20minimalist%20logo%20for%20chrome%20extension%20called%20${encodedTitle}?width=128&height=128&nologo=true`;
    const bannerUrl = `https://image.pollinations.ai/prompt/Promo%20banner%20for%20chrome%20extension%20${encodedTitle}%20modern%20tech%20background?width=440&height=280&nologo=true`;

    // Save to MongoDB
    const extension = new Extension({
      userId,
      title: aiResponse.title,
      prompt,
      files: sanitizedFiles,
      zipPath,
      monetizationLink: monetizationLink || null,
      storeAssets: {
        logoUrl,
        bannerUrl,
        description: aiResponse.storeDescription || 'A powerful Chrome Extension.'
      },
      iterationHistory: [{ prompt, timestamp: new Date() }],
    });

    await extension.save();

    res.status(201).json({
      success: true,
      extension: {
        id: extension._id,
        title: extension.title,
        storeAssets: extension.storeAssets,
        files: sanitizedFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
        iterationHistory: extension.iterationHistory,
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
        storeAssets: extension.storeAssets,
        files: sanitizedFiles.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
        iterationHistory: extension.iterationHistory,
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

const getPublicGallery = async (req, res) => {
  try {
    const extensions = await Extension.find({ isPublic: true })
      .sort({ upvotes: -1, createdAt: -1 })
      .populate('userId', 'username')
      .limit(50);

    res.status(200).json({
      success: true,
      extensions: extensions.map(ext => ({
        id: ext._id,
        title: ext.title,
        prompt: ext.prompt,
        storeAssets: ext.storeAssets,
        upvotes: ext.upvotes,
        cloneCount: ext.cloneCount,
        createdAt: ext.createdAt,
      }))
    });
  } catch (error) {
    console.error('Gallery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const extension = await Extension.findById(id);
    if (!extension || extension.userId.toString() !== userId) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    extension.isPublic = !extension.isPublic;
    await extension.save();

    res.status(200).json({ success: true, isPublic: extension.isPublic });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const upvoteExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const extension = await Extension.findById(id);
    if (!extension || !extension.isPublic) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    extension.upvotes += 1;
    await extension.save();

    res.status(200).json({ success: true, upvotes: extension.upvotes });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const cloneExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const sourceExtension = await Extension.findById(id);
    if (!sourceExtension || !sourceExtension.isPublic) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    // Increment clone count on source
    sourceExtension.cloneCount += 1;
    await sourceExtension.save();

    // Create a deep copy of files for the new zip
    const newFiles = sourceExtension.files.map(f => ({
      filename: f.filename,
      content: f.content
    }));

    const extensionId = uuidv4();
    const zipPath = await createZip(extensionId, newFiles);

    const clonedExtension = new Extension({
      userId,
      title: sourceExtension.title + ' (Clone)',
      prompt: sourceExtension.prompt,
      files: newFiles,
      zipPath,
      monetizationLink: sourceExtension.monetizationLink,
      storeAssets: sourceExtension.storeAssets,
      iterationHistory: [{ prompt: 'Cloned from Gallery', timestamp: new Date() }],
    });

    await clonedExtension.save();

    res.status(201).json({ success: true, extensionId: clonedExtension._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const debugExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const { errorMessage } = req.body;
    const userId = req.user.userId;

    if (!errorMessage || errorMessage.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide the error message' });
    }

    const extension = await Extension.findById(id);
    if (!extension || extension.userId.toString() !== userId) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    // Pass the existing code + error to the AI
    const combinedPrompt = `Original prompt: "${extension.prompt}". 
The generated code threw this error: "${errorMessage}". 
Please fix the code files to resolve this error.`;

    let aiResponse = await generateExtensionFiles(combinedPrompt, { monetizationLink: extension.monetizationLink });
    let sanitizedFiles = sanitizeFiles(aiResponse.files);
    
    const newZipPath = await createZip(id, sanitizedFiles);

    if (extension.zipPath && fs.existsSync(extension.zipPath)) cleanupZip(extension.zipPath);

    extension.title = aiResponse.title;
    extension.files = sanitizedFiles;
    extension.zipPath = newZipPath;
    extension.iterationHistory.push({ prompt: 'DEBUG: ' + errorMessage, timestamp: new Date() });
    
    await extension.save();
    res.status(200).json({
      success: true,
      extension: {
        id: extension._id,
        title: extension.title,
        files: sanitizedFiles.map((f) => ({ filename: f.filename, content: f.content })),
        iterationHistory: extension.iterationHistory,
        updatedAt: extension.updatedAt,
      },
    });
  } catch (error) {
    console.error('Debug extension error:', error);
    res.status(400).json({ message: error.message || 'Failed to auto-fix bug due to AI provider error' });
  }
};

const auditExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const extension = await Extension.findById(id);
    if (!extension) {
      return res.status(404).json({ message: 'Extension not found' });
    }

    if (extension.userId.toString() !== userId && !extension.isPublic) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const auditResult = await auditExtensionCode(extension.files);

    res.status(200).json({
      success: true,
      audit: auditResult
    });
  } catch (error) {
    console.error('Audit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const enhancePrompt = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length === 0) {
      return res.status(400).json({ message: 'Please provide a prompt to enhance' });
    }

    const systemPrompt = `You are an expert Chrome Extension product designer. The user has written a brief description of a Chrome extension they want to build. Your job is to expand it into a detailed, high-quality prompt that will produce a better extension.

Rules:
1. Keep the user's original intent intact.
2. Add specific UI details (popup layout, colors, components).
3. Add functional details (what APIs to use, storage, permissions).
4. Add UX details (animations, loading states, error handling).
5. Keep it to 8-12 bullet points maximum.
6. Output ONLY the enhanced prompt text, no explanation, no markdown formatting, no quotes.`;

    let enhancedPrompt = null;

    // Try Groq first
    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Enhance this Chrome extension prompt:\n"${prompt}"` }
            ],
            max_tokens: 1000
          })
        });
        const data = await groqResponse.json();
        if (groqResponse.ok && data.choices && data.choices[0]) {
          enhancedPrompt = data.choices[0].message.content.trim();
        }
      } catch (e) {
        console.error('Groq enhance failed:', e.message);
      }
    }

    // Fallback to Gemini
    if (!enhancedPrompt && process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const response = await model.generateContent(`${systemPrompt}\n\nEnhance this Chrome extension prompt:\n"${prompt}"`);
        enhancedPrompt = response.response.text().trim();
      } catch (e) {
        console.error('Gemini enhance failed:', e.message);
      }
    }

    if (!enhancedPrompt) {
      return res.status(500).json({ message: 'Failed to enhance prompt. Please try again.' });
    }

    // Clean up any quotes wrapping the response
    enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, '').trim();

    res.status(200).json({ success: true, enhancedPrompt });
  } catch (error) {
    console.error('Enhance prompt error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getSharedExtension = async (req, res) => {
  try {
    const { id } = req.params;

    const extension = await Extension.findById(id);
    if (!extension || !extension.isPublic) {
      return res.status(404).json({ message: 'Extension not found or not public' });
    }

    res.status(200).json({
      success: true,
      extension: {
        id: extension._id,
        title: extension.title,
        prompt: extension.prompt,
        storeAssets: extension.storeAssets,
        files: extension.files.map((f) => ({
          filename: f.filename,
          content: f.content,
        })),
        upvotes: extension.upvotes,
        cloneCount: extension.cloneCount,
        createdAt: extension.createdAt,
      },
    });
  } catch (error) {
    console.error('Get shared extension error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
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
};
