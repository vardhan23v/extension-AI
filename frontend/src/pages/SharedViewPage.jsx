import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Copy, ArrowLeft, Code2, Eye, FileCode, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BrowserFrame from '../components/BrowserFrame';
import LoadingSpinner from '../components/LoadingSpinner';

const SharedViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [extension, setExtension] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    fetchSharedExtension();
  }, [id]);

  const fetchSharedExtension = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/extensions/shared/${id}`);
      setExtension(response.data.extension);
    } catch (err) {
      setError(err.response?.data?.message || 'Extension not found or not public.');
    } finally {
      setLoading(false);
    }
  };

  const handleClone = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await api.post(`/extensions/${id}/clone`);
      toast.success('Extension cloned to your dashboard!');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to clone extension');
    }
  };

  const handleUpvote = async () => {
    try {
      const response = await api.post(`/extensions/${id}/upvote`);
      setExtension((prev) => ({ ...prev, upvotes: response.data.upvotes }));
    } catch (err) {
      console.error(err);
    }
  };

  const getIframeSource = () => {
    if (!extension || !extension.files) return '';

    const htmlFile = extension.files.find((f) => f.filename === 'popup.html')?.content;
    const jsFile = extension.files.find((f) => f.filename === 'popup.js')?.content || '';
    const cssFile = extension.files.find((f) => f.filename.endsWith('.css'))?.content || '';

    if (!htmlFile) {
      return `
        <html style="background-color: #111827; color: #9ca3af; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100%; margin: 0; text-align: center;">
          <body>
            <div>
              <p>This extension runs in the background<br/>and does not have a popup interface.</p>
            </div>
          </body>
        </html>
      `;
    }

    const chromeMock = `
      <script>
        window.chrome = window.chrome || {};
        const noop = () => {};
        const callbackNoop = (...args) => { const cb = args.find(a => typeof a === 'function'); if (cb) setTimeout(() => cb({}), 0); };
        const storageArea = {
          get: (keys, cb) => { if (cb) setTimeout(() => cb({}), 0); return Promise.resolve({}); },
          set: (items, cb) => { if (cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
          remove: (keys, cb) => { if (cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
          clear: (cb) => { if (cb) setTimeout(() => cb(), 0); return Promise.resolve(); },
          onChanged: { addListener: noop, removeListener: noop }
        };
        chrome.storage = { local: storageArea, sync: storageArea, onChanged: { addListener: noop } };
        chrome.runtime = { sendMessage: callbackNoop, onMessage: { addListener: noop }, getURL: (p) => p, id: 'preview-mock' };
        chrome.tabs = { query: (q, cb) => { if (cb) setTimeout(() => cb([{ id: 1, title: 'Tab', url: 'https://example.com' }]), 0); return Promise.resolve([]); }, create: callbackNoop, update: callbackNoop, remove: callbackNoop, sendMessage: callbackNoop, onUpdated: { addListener: noop }, onRemoved: { addListener: noop } };
        chrome.action = { setBadgeText: noop, setBadgeBackgroundColor: noop, onClicked: { addListener: noop } };
        chrome.browserAction = chrome.action;
        chrome.alarms = { create: noop, clear: noop, onAlarm: { addListener: noop } };
        chrome.notifications = { create: callbackNoop, clear: callbackNoop };
        chrome.commands = { onCommand: { addListener: noop } };
        chrome.contextMenus = { create: noop, onClicked: { addListener: noop } };
        chrome.i18n = { getMessage: (m) => m };
        chrome.scripting = { executeScript: callbackNoop, insertCSS: callbackNoop };
        chrome.permissions = { contains: (p, cb) => { if(cb) cb(true); return Promise.resolve(true); }, request: (p, cb) => { if(cb) cb(true); return Promise.resolve(true); } };
        window.addEventListener('error', (e) => e.preventDefault());
        window.addEventListener('unhandledrejection', (e) => e.preventDefault());
      <\/script>
    `;

    const isFullDocument = htmlFile.trim().toLowerCase().startsWith('<!doctype') ||
                           htmlFile.trim().toLowerCase().startsWith('<html');

    if (isFullDocument) {
      let processed = htmlFile;
      processed = processed.replace(/<script\s+src=["']popup\.js["'][^>]*>\s*<\/script>/gi, '');
      processed = processed.replace(/<link[^>]*href=["'][^"']*\.css["'][^>]*\/?>/gi, '');
      const cssInjection = '<style>' + cssFile + '</style>';
      if (processed.includes('</head>')) {
        processed = processed.replace('</head>', cssInjection + '</head>');
      }
      if (!processed.includes('tailwindcss.com')) {
        const tailwindScript = '<script src="https://cdn.tailwindcss.com"></script>';
        if (processed.includes('</head>')) {
          processed = processed.replace('</head>', tailwindScript + '</head>');
        }
      }
      const jsInjection = chromeMock + (jsFile ? '<script>' + jsFile + '<\/script>' : '');
      if (processed.includes('</body>')) {
        processed = processed.replace('</body>', jsInjection + '</body>');
      } else {
        processed += jsInjection;
      }
      return processed;
    }

    const tailwindScript = htmlFile.includes('tailwindcss.com') ? '' : '<script src="https://cdn.tailwindcss.com"></script>';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${tailwindScript}
          <style>*, *::before, *::after { box-sizing: border-box; } body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }</style>
          <style>${cssFile}</style>
        </head>
        <body>
          ${chromeMock}
          ${htmlFile}
          ${jsFile ? '<script>' + jsFile + '<\/script>' : ''}
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#05010D] flex items-center justify-center transition-colors">
        <LoadingSpinner message="Loading extension..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#05010D] flex items-center justify-center transition-colors">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ExternalLink className="w-10 h-10 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Extension Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/gallery')}
            className="px-6 py-2 bg-gradient-main text-white rounded-xl font-medium"
          >
            Browse Gallery
          </button>
        </motion.div>
      </div>
    );
  }

  const iframeSrc = getIframeSource();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-white dark:bg-[#05010D] py-8 relative overflow-hidden transition-colors"
    >
      <div className="absolute top-[-10%] right-[-5%] w-[35%] h-[35%] bg-purple-main/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] bg-blue-main/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back button */}
        <motion.button
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          onClick={() => navigate('/gallery')}
          className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Gallery</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            {extension.storeAssets?.logoUrl && (
              <img
                src={extension.storeAssets.logoUrl}
                alt="Logo"
                className="w-16 h-16 rounded-xl border border-gray-200 dark:border-gray-800 shadow-lg"
              />
            )}
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{extension.title}</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                {extension.storeAssets?.description || extension.prompt}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUpvote}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-400 hover:text-pink-400 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-pink-500/30 transition-all"
            >
              <Heart className="w-5 h-5" />
              <span className="font-bold">{extension.upvotes}</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClone}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-main text-white rounded-xl font-bold shadow-lg shadow-purple-900/20"
            >
              <Copy className="w-4 h-4" />
              Clone to My Extensions
            </motion.button>
          </div>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-800">
          {[
            { id: 'preview', label: 'Live Preview', icon: Eye },
            { id: 'code', label: 'Source Code', icon: Code2 },
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 pb-3 px-4 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="sharedTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-main"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card-premium rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-main" />

          {activeTab === 'preview' && (
            <BrowserFrame extensionTitle={extension.title} iframeSrcDoc={iframeSrc}>
              <iframe
                title="Shared Extension Preview"
                srcDoc={iframeSrc}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
              />
            </BrowserFrame>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              {extension.files?.map((file, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.filename}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(file.content);
                        toast.success(`Copied ${file.filename}!`);
                      }}
                      className="text-xs px-2.5 py-1 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-400/30 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="p-4 text-xs text-gray-300 font-mono bg-gray-900 overflow-x-auto max-h-72">
                    <code>{file.content}</code>
                  </pre>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats footer */}
        <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500 dark:text-gray-500">
          <span>{extension.upvotes} upvotes</span>
          <span>•</span>
          <span>{extension.cloneCount} clones</span>
          <span>•</span>
          <span>{extension.files?.length || 0} files</span>
        </div>
      </div>
    </motion.div>
  );
};

export default SharedViewPage;
