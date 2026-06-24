import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import PromptInput from '../components/PromptInput';
import FilePreview from '../components/FilePreview';
import ProgressStepper from '../components/ProgressStepper';
import ChatPanel from '../components/ChatPanel';
import DiffViewer from '../components/DiffViewer';
import VersionTimeline from '../components/VersionTimeline';
import BlueprintModal from '../components/BlueprintModal';
import BrowserFrame from '../components/BrowserFrame';
import {
  AlertCircle,
  CheckCircle,
  Zap,
  Eye,
  Code,
  Code2,
  Image as ImageIcon,
  Bug,
  Share2,
  GitCompare,
  Clock,
  MessageSquare,
  ShieldCheck,
  Link2,
} from 'lucide-react';

const GeneratorPage = () => {
  const navigate = useNavigate();
  const [generatedExtension, setGeneratedExtension] = useState(null);
  const [previousFiles, setPreviousFiles] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('code');
  const [debugError, setDebugError] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [blueprintOpen, setBlueprintOpen] = useState(false);
  const [blueprintPrompt, setBlueprintPrompt] = useState('');
  const [filesEdited, setFilesEdited] = useState(false);
  const [chatIterating, setChatIterating] = useState(false);
  const [securityAudit, setSecurityAudit] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const promptInputRef = useRef(null);

  const generateExtension = async (prompt, options = {}) => {
    setIsLoading(true);
    setStatusMessage('Sending prompt to AI...');
    setPreviousFiles(null);

    try {
      setTimeout(() => {
        setStatusMessage((prev) => (prev ? 'Validating generated files...' : prev));
      }, 2500);

      setTimeout(() => {
        setStatusMessage((prev) => (prev ? 'Generating scripts and assets...' : prev));
      }, 5000);

      setTimeout(() => {
        setStatusMessage((prev) => (prev ? 'Packaging your extension...' : prev));
      }, 8000);

      const response = await api.post('/extensions/generate', { prompt, ...options });
      setGeneratedExtension(response.data.extension);
      toast.success('Extension generated successfully!');
      setStatusMessage('');
      setFilesEdited(false);
      setActiveTab('preview');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to generate extension';
      toast.error(errorMsg);
      setStatusMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  const iterateExtension = async (newPrompt, callback) => {
    if (!generatedExtension) return;

    // Save current files for diff
    setPreviousFiles(
      generatedExtension.files?.map((f) => ({ filename: f.filename, content: f.content })) || []
    );

    const isChat = !!callback;
    if (isChat) {
      setChatIterating(true);
    } else {
      setIsLoading(true);
    }

    setStatusMessage('Applying modifications...');

    try {
      const response = await api.post(`/extensions/iterate/${generatedExtension.id}`, {
        prompt: newPrompt,
      });

      const ext = response.data.extension;
      setGeneratedExtension(ext);
      toast.success('Extension modified successfully!');
      setStatusMessage('');
      setFilesEdited(false);
      setActiveTab('preview');

      if (callback) callback(ext);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to iterate extension';
      toast.error(errorMsg);
      setStatusMessage('');
      if (callback) callback(null);
    } finally {
      setIsLoading(false);
      setChatIterating(false);
    }
  };

  const downloadExtension = async () => {
    if (!generatedExtension) return;

    try {
      const response = await api.get(`/extensions/download/${generatedExtension.id}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${generatedExtension.title}-extension.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (err) {
      toast.error('Failed to download extension');
    }
  };

  const handlePromptSubmit = (prompt, options) => {
    generateExtension(prompt, options);
  };

  const handleDebugSubmit = async () => {
    if (!generatedExtension || !debugError.trim()) return;

    setPreviousFiles(
      generatedExtension.files?.map((f) => ({ filename: f.filename, content: f.content })) || []
    );

    setIsLoading(true);
    setStatusMessage('Auto-fixing code based on error...');

    try {
      const response = await api.post(`/extensions/${generatedExtension.id}/debug`, {
        errorMessage: debugError,
      });
      setGeneratedExtension(response.data.extension);
      toast.success('Bug fixed automatically!');
      setDebugError('');
      setActiveTab('code');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to auto-fix bug');
    } finally {
      setIsLoading(false);
      setStatusMessage('');
    }
  };

  const togglePublish = async () => {
    if (!generatedExtension) return;
    setIsPublishing(true);
    try {
      const response = await api.post(`/extensions/${generatedExtension.id}/publish`);
      setIsPublic(response.data.isPublic);
      if (response.data.isPublic) {
        toast.success('Published to Community Gallery!');
      } else {
        toast.success('Removed from Community Gallery');
      }
    } catch (err) {
      toast.error('Failed to update publish status');
    } finally {
      setIsPublishing(false);
    }
  };

  const runAudit = async () => {
    if (!generatedExtension) return;
    setIsAuditing(true);
    try {
      const response = await api.post(`/extensions/${generatedExtension.id}/audit`);
      setSecurityAudit(response.data.audit);
      toast.success('Audit complete');
    } catch (err) {
      toast.error('Audit failed');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleFilesChange = (updatedFiles) => {
    if (generatedExtension) {
      setGeneratedExtension({ ...generatedExtension, files: updatedFiles });
      setFilesEdited(true);
    }
  };

  const handleBlueprintSelect = (prompt) => {
    setBlueprintPrompt(prompt);
  };

  const handleRestoreVersion = (prompt) => {
    iterateExtension(prompt);
  };

  const getIframeSource = () => {
    if (!generatedExtension || !generatedExtension.files) return '';

    const htmlFile = generatedExtension.files.find((f) => f.filename === 'popup.html')?.content;
    const jsFile = generatedExtension.files.find((f) => f.filename === 'popup.js')?.content || '';
    const cssFile =
      generatedExtension.files.find((f) => f.filename.endsWith('.css'))?.content || '';

    if (!htmlFile) {
      return `
        <html style="background-color: #111827; color: #9ca3af; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100%; margin: 0; text-align: center;">
          <body>
            <div>
              <svg style="width: 48px; height: 48px; margin: 0 auto 16px; opacity: 0.5;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>This extension runs in the background<br/>and does not have a popup interface.</p>
            </div>
          </body>
        </html>
      `;
    }

    // Chrome API mock so scripts don't crash in the iframe
    const chromeMock = `
      <script>
        // Mock chrome.* APIs for preview
        window.chrome = window.chrome || {};
        const noop = () => {};
        const callbackNoop = (...args) => {
          const cb = args.find(a => typeof a === 'function');
          if (cb) setTimeout(() => cb({}), 0);
        };
        const storageArea = {
          get: (keys, cb) => {
            let result = {};
            try {
              const stored = JSON.parse(localStorage.getItem('chrome_storage_mock') || '{}');
              if (typeof keys === 'string') result[keys] = stored[keys];
              else if (Array.isArray(keys)) keys.forEach(k => result[k] = stored[k]);
              else if (keys && typeof keys === 'object') {
                result = { ...keys };
                Object.keys(keys).forEach(k => { if (stored[k] !== undefined) result[k] = stored[k]; });
              } else result = stored;
            } catch(e) {}
            if (cb) setTimeout(() => cb(result), 0);
            return Promise.resolve(result);
          },
          set: (items, cb) => {
            try {
              const stored = JSON.parse(localStorage.getItem('chrome_storage_mock') || '{}');
              Object.assign(stored, items);
              localStorage.setItem('chrome_storage_mock', JSON.stringify(stored));
            } catch(e) {}
            if (cb) setTimeout(() => cb(), 0);
            return Promise.resolve();
          },
          remove: (keys, cb) => {
            try {
              const stored = JSON.parse(localStorage.getItem('chrome_storage_mock') || '{}');
              const keysArray = Array.isArray(keys) ? keys : [keys];
              keysArray.forEach(k => delete stored[k]);
              localStorage.setItem('chrome_storage_mock', JSON.stringify(stored));
            } catch(e) {}
            if (cb) setTimeout(() => cb(), 0);
            return Promise.resolve();
          },
          clear: (cb) => {
            localStorage.removeItem('chrome_storage_mock');
            if (cb) setTimeout(() => cb(), 0);
            return Promise.resolve();
          },
          onChanged: { addListener: noop, removeListener: noop }
        };
        chrome.storage = { local: storageArea, sync: storageArea, onChanged: { addListener: noop, removeListener: noop } };
        chrome.runtime = {
          sendMessage: callbackNoop,
          onMessage: { addListener: noop, removeListener: noop },
          getURL: (p) => p,
          id: 'preview-mock-id',
          lastError: null
        };
        chrome.tabs = {
          query: (q, cb) => { if (cb) setTimeout(() => cb([{ id: 1, title: 'Example Tab', url: 'https://example.com', favIconUrl: '' }]), 0); return Promise.resolve([]); },
          create: callbackNoop,
          update: callbackNoop,
          remove: callbackNoop,
          sendMessage: callbackNoop,
          onUpdated: { addListener: noop, removeListener: noop },
          onRemoved: { addListener: noop, removeListener: noop }
        };
        chrome.action = { setBadgeText: noop, setBadgeBackgroundColor: noop, onClicked: { addListener: noop } };
        chrome.browserAction = chrome.action;
        chrome.alarms = { create: noop, clear: noop, onAlarm: { addListener: noop } };
        chrome.notifications = { create: callbackNoop, clear: callbackNoop };
        chrome.commands = { onCommand: { addListener: noop } };
        chrome.contextMenus = { create: noop, onClicked: { addListener: noop } };
        chrome.i18n = { getMessage: (m) => m };
        chrome.scripting = { executeScript: callbackNoop, insertCSS: callbackNoop };
        chrome.permissions = { contains: (p, cb) => { if(cb) cb(true); return Promise.resolve(true); }, request: (p, cb) => { if(cb) cb(true); return Promise.resolve(true); } };
        // Catch unhandled errors silently in preview
        window.addEventListener('error', (e) => e.preventDefault());
        window.addEventListener('unhandledrejection', (e) => e.preventDefault());
      <\/script>
    `;

    // Check if popup.html is a full HTML document or just a fragment
    const isFullDocument = htmlFile.trim().toLowerCase().startsWith('<!doctype') ||
                           htmlFile.trim().toLowerCase().startsWith('<html');

    if (isFullDocument) {
      // It's a full document — inject our CSS + chrome mock + JS into it
      let processed = htmlFile;

      // Remove <script src="popup.js"> references since we'll inline the script
      processed = processed.replace(/<script\s+src=["']popup\.js["'][^>]*>\s*<\/script>/gi, '');
      // Remove <link rel="stylesheet" href="popup.css"> or similar since we'll inline the styles
      processed = processed.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi, '');

      // Inject CSS right before </head> or at the start
      const cssInjection = '<style>' + cssFile + '</style>';
      if (processed.includes('</head>')) {
        processed = processed.replace('</head>', cssInjection + '</head>');
      } else if (processed.includes('<body')) {
        processed = processed.replace(/<body/i, cssInjection + '<body');
      }

      // Inject tailwind if missing (safeguard)
      if (!processed.includes('tailwindcss.com')) {
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
        if (processed.includes('</head>')) {
          processed = processed.replace('</head>', tailwindScript + '</head>');
        } else if (processed.includes('<body')) {
          processed = processed.replace(/<body/i, tailwindScript + '<body');
        }
      }

      // Inject chrome mock + JS right before </body>
      const jsInjection = chromeMock + (jsFile ? '<script>' + jsFile + '<\/script>' : '');
      if (processed.includes('</body>')) {
        processed = processed.replace('</body>', jsInjection + '</body>');
      } else {
        processed += jsInjection;
      }

      return processed;
    } else {
      // It's a fragment — wrap in a full document
      const tailwindScript = htmlFile.includes('tailwindcss.com') ? '' : '<script src="https://cdn.tailwindcss.com"></script>';
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            ${tailwindScript}
            <style>
              *, *::before, *::after { box-sizing: border-box; }
              body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            </style>
            <style>${cssFile}</style>
          </head>
          <body>
            ${chromeMock}
            ${htmlFile}
            ${jsFile ? '<script>' + jsFile + '<\/script>' : ''}
          </body>
        </html>
      `;
    }
  };

  const TABS = [
    { id: 'code', label: 'Code', icon: Code },
    { id: 'preview', label: 'Preview', icon: Eye },
    { id: 'diff', label: 'Diff', icon: GitCompare },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'store', label: 'Assets', icon: ImageIcon },
    { id: 'security', label: 'Security', icon: ShieldCheck },
    { id: 'debug', label: 'Fix Bug', icon: Bug },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white dark:bg-gray-950 py-8 relative overflow-hidden transition-colors duration-300"
    >
      {/* Abstract Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-main/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-main/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input & Chat */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="sticky top-20 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-main">
                  Generate Extension
                </h2>

                {/* Blueprint button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBlueprintOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-purple-100 dark:bg-purple-main/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-main/30 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-main/20 transition-colors font-medium"
                >
                  <Zap className="w-4 h-4" />
                  Blueprints
                </motion.button>
              </div>

              <PromptInput
                ref={promptInputRef}
                onSubmit={handlePromptSubmit}
                isLoading={isLoading}
                isModifying={false}
                externalPrompt={blueprintPrompt}
                onExternalPromptConsumed={() => setBlueprintPrompt('')}
              />

              {/* Chat Copilot Panel */}
              {generatedExtension && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-card rounded-2xl overflow-hidden"
                >
                  <ChatPanel
                    extensionId={generatedExtension.id}
                    extensionTitle={generatedExtension.title}
                    onIterate={(prompt, callback) => iterateExtension(prompt, callback)}
                    isLoading={chatIterating}
                  />
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Right Panel - Output */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >

            {statusMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mb-4 glass-panel rounded-xl p-4 border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-gray-900/60"
              >
                <p className="text-blue-400 text-sm flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  {statusMessage}
                </p>
              </motion.div>
            )}

            {generatedExtension && !isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card-premium rounded-2xl p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-main" />
                <div className="mb-6 mt-2 flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                      {generatedExtension.title}
                    </h3>
                    <p className="text-gray-400 text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                      {generatedExtension.files?.length || 0} files generated
                      {filesEdited && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium ml-1">
                          Manually Edited
                        </span>
                      )}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePublish}
                    disabled={isPublishing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isPublic
                        ? 'bg-purple-main/20 text-purple-300 border border-purple-main/50'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <Share2 className="w-4 h-4" />
                    {isPublic ? 'Published' : 'Publish'}
                  </motion.button>
                  {isPublic && generatedExtension && (
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/shared/${generatedExtension.id}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Share link copied!');
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-main/10 text-blue-400 border border-blue-main/30 hover:bg-blue-main/20 transition-colors"
                    >
                      <Link2 className="w-4 h-4" />
                      Copy Link
                    </motion.button>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-800 mb-6 gap-1 overflow-x-auto relative">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-3 px-3 flex items-center gap-1.5 text-sm font-medium transition-colors whitespace-nowrap relative ${
                        activeTab === tab.id
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-main"
                          initial={false}
                          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'code' && (
                    <FilePreview
                      files={generatedExtension.files || []}
                      onFilesChange={handleFilesChange}
                    />
                  )}

                  {activeTab === 'preview' && (
                    <BrowserFrame extensionTitle={generatedExtension.title} iframeSrcDoc={getIframeSource()}>
                      <iframe
                        title="Extension Preview"
                        srcDoc={getIframeSource()}
                        className="w-full h-full border-none"
                        sandbox="allow-scripts"
                      />
                    </BrowserFrame>
                  )}

                  {activeTab === 'diff' && (
                    <DiffViewer
                      oldFiles={previousFiles || []}
                      newFiles={generatedExtension.files || []}
                    />
                  )}

                  {activeTab === 'history' && (
                    <VersionTimeline
                      history={generatedExtension.iterationHistory || []}
                      onRestore={handleRestoreVersion}
                      isLoading={isLoading}
                    />
                  )}

                  {activeTab === 'store' && generatedExtension.storeAssets && (
                    <div className="space-y-6">
                      <div className="h-48 w-full rounded-xl overflow-hidden relative border border-gray-700">
                        <img
                          src={generatedExtension.storeAssets.bannerUrl}
                          alt="Banner"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute -bottom-8 left-6 bg-gray-950 p-1.5 rounded-2xl shadow-2xl border border-gray-800">
                          <img
                            src={generatedExtension.storeAssets.logoUrl}
                            alt="Logo"
                            className="w-20 h-20 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="pt-8">
                        <h4 className="text-white font-bold mb-2">Store Description</h4>
                        <p className="text-gray-400 text-sm bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                          {generatedExtension.storeAssets.description}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-white font-bold">Security & Permissions Audit</h4>
                        <button
                          onClick={runAudit}
                          disabled={isAuditing}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                        >
                          {isAuditing ? 'Auditing...' : 'Run Audit'}
                        </button>
                      </div>
                      
                      {!securityAudit && !isAuditing && (
                        <p className="text-gray-400 text-sm">Run an AI security audit to check for excessive permissions and bad practices.</p>
                      )}
                      
                      {securityAudit && (
                        <div className="space-y-4">
                          <div className={`p-6 rounded-xl border ${securityAudit.score >= 80 ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                            <div className="flex items-center gap-4">
                              <div className={`text-4xl font-extrabold ${securityAudit.score >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                                {securityAudit.score}/100
                              </div>
                              <div>
                                <h5 className={`font-bold ${securityAudit.score >= 80 ? 'text-green-300' : 'text-red-300'}`}>
                                  {securityAudit.isSafe ? 'Looks Safe' : 'Security Risks Detected'}
                                </h5>
                                <p className="text-sm text-gray-400 mt-1">Based on Manifest V3 best practices.</p>
                              </div>
                            </div>
                          </div>
                          
                          {securityAudit.warnings && securityAudit.warnings.length > 0 && (
                            <div className="space-y-2 mt-4">
                              <h5 className="text-white font-semibold text-sm">Warnings:</h5>
                              <ul className="list-disc pl-5 space-y-1">
                                {securityAudit.warnings.map((warn, i) => (
                                  <li key={i} className="text-amber-400 text-sm">{warn}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'debug' && (
                    <div className="space-y-4">
                      <p className="text-gray-400 text-sm">
                        Paste any error from your Chrome console here, and the AI will fix the
                        code automatically.
                      </p>
                      <textarea
                        value={debugError}
                        onChange={(e) => setDebugError(e.target.value)}
                        placeholder="Uncaught TypeError: Cannot read properties of null..."
                        className="w-full h-40 bg-gray-900 border border-gray-700 rounded-xl text-red-300 font-mono text-sm p-4 resize-none focus:outline-none focus:border-red-500/50"
                      />
                      <button
                        onClick={handleDebugSubmit}
                        disabled={!debugError.trim() || isLoading}
                        className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors font-semibold flex items-center justify-center gap-2"
                      >
                        <Zap className="w-5 h-5" /> Auto-Fix Bug
                      </button>
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadExtension}
                  className="w-full mt-6 py-4 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 transition-all flex items-center justify-center gap-2"
                >
                  Download .zip Package
                  {filesEdited && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-medium">
                      incl. edits
                    </span>
                  )}
                </motion.button>
              </motion.div>
            ) : isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card-premium rounded-2xl p-6 min-h-[400px] flex items-center justify-center"
              >
                <ProgressStepper statusMessage={statusMessage} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card-premium rounded-2xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center border-dashed border-2 border-purple-900/30 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-purple-main/5 to-transparent pointer-events-none" />
                
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-purple-main/20 rounded-full blur-xl animate-pulse-slow" />
                  <div className="w-20 h-20 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center justify-center relative z-10 shadow-2xl">
                    <Code2 className="w-10 h-10 text-purple-400 animate-pulse" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 relative z-10">AI Canvas Ready</h3>
                <p className="text-gray-400 font-medium mb-8 max-w-sm relative z-10">
                  Describe your extension in the prompt box, and watch the AI generate your complete codebase here in real-time.
                </p>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setBlueprintOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm bg-purple-main/10 text-purple-400 border border-purple-main/30 rounded-xl hover:bg-purple-main/20 transition-colors font-medium relative z-10 btn-shimmer"
                >
                  <Zap className="w-4 h-4" />
                  Or start from a Blueprint
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Blueprint Modal */}
      <BlueprintModal
        isOpen={blueprintOpen}
        onClose={() => setBlueprintOpen(false)}
        onSelectBlueprint={handleBlueprintSelect}
      />
    </motion.div>
  );
};

export default GeneratorPage;
