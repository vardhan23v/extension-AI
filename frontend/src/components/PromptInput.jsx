import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { Sparkles, Wand2, Clock, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import api from '../api/axios';

const PROMPT_HISTORY_KEY = 'extensio_prompt_history';
const MAX_HISTORY = 10;

const getPromptHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(PROMPT_HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
};

const savePromptToHistory = (prompt) => {
  const history = getPromptHistory();
  const trimmed = prompt.trim();
  if (!trimmed) return;
  // Remove duplicates, add to front
  const updated = [trimmed, ...history.filter((p) => p !== trimmed)].slice(0, MAX_HISTORY);
  localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(updated));
};

const PromptInput = forwardRef(({ onSubmit, isLoading, isModifying = false, externalPrompt, onExternalPromptConsumed }, ref) => {
  const [prompt, setPrompt] = useState('');
  const [enableMonetization, setEnableMonetization] = useState(false);
  const [monetizationLink, setMonetizationLink] = useState('');
  
  const [enableWebhook, setEnableWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  
  const [enableI18n, setEnableI18n] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);

  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);

  const historyRef = useRef(null);

  const availableLanguages = [
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' }
  ];

  const handleLanguageToggle = (code) => {
    setSelectedLanguages(prev => 
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  // Handle external prompt from Blueprint modal
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      if (onExternalPromptConsumed) onExternalPromptConsumed();
    }
  }, [externalPrompt, onExternalPromptConsumed]);

  // Handle template prompt from localStorage (set by TemplatesPage)
  useEffect(() => {
    const templatePrompt = localStorage.getItem('templatePrompt');
    if (templatePrompt) {
      setPrompt(templatePrompt);
      localStorage.removeItem('templatePrompt');
    }
  }, []);

  // Load prompt history on mount and when dropdown opens
  useEffect(() => {
    if (showHistory) {
      setPromptHistory(getPromptHistory());
    }
  }, [showHistory]);

  // Close history dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (historyRef.current && !historyRef.current.contains(e.target)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const examplePrompts = [
    'Block all ads on YouTube',
    'Add a dark mode to any website',
    'Show word count on any page',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      savePromptToHistory(prompt);
      onSubmit(prompt, {
        monetizationLink: enableMonetization ? monetizationLink : null,
        webhookUrl: enableWebhook ? webhookUrl : null,
        languages: enableI18n ? selectedLanguages : []
      });
      setPrompt('');
    }
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const response = await api.post('/extensions/enhance-prompt', { prompt });
      if (response.data.enhancedPrompt) {
        setPrompt(response.data.enhancedPrompt);
        toast.success('Prompt enhanced!');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleClearHistory = () => {
    localStorage.removeItem(PROMPT_HISTORY_KEY);
    setPromptHistory([]);
    toast.success('Prompt history cleared');
  };

  const handleSelectHistoryItem = (historyPrompt) => {
    setPrompt(historyPrompt);
    setShowHistory(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" ref={ref}>
      {/* Textarea with enhance and history buttons */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isModifying ? 'Describe how you want to modify the extension...' : 'Describe your Chrome extension...'}
          className="w-full h-40 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main p-4 pr-24 resize-none transition-colors"
          disabled={isLoading || isEnhancing}
        />

        {/* Right-side action buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          {/* Enhance button */}
          {prompt.trim().length > 5 && !isModifying && (
            <motion.button
              type="button"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || isLoading}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 rounded-lg hover:bg-amber-500/20 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              title="Enhance prompt with AI"
            >
              <Wand2 className={`w-3 h-3 ${isEnhancing ? 'animate-spin' : ''}`} />
              {isEnhancing ? 'Enhancing...' : 'Enhance'}
            </motion.button>
          )}

          {/* History button */}
          <div className="relative" ref={historyRef}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700/50 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
              title="Prompt history"
            >
              <Clock className="w-3 h-3" />
              <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
            </motion.button>

            {/* History dropdown */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Recent Prompts</span>
                    {promptHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        className="text-[10px] text-red-400 hover:text-red-300 font-medium"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {promptHistory.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-gray-500 dark:text-gray-500 text-center">
                        No prompt history yet
                      </div>
                    ) : (
                      promptHistory.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectHistoryItem(item)}
                          className="w-full text-left px-3 py-2.5 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-50 dark:border-gray-800/30 last:border-b-0 line-clamp-2"
                        >
                          {item}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {!isModifying && prompt.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">💡 Try these ideas:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(example)}
                className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !prompt.trim() || isEnhancing}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity ${
          isLoading || !prompt.trim() || isEnhancing
            ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : 'bg-gradient-main text-white hover:opacity-90'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        {isModifying ? 'Apply Changes' : 'Generate Extension'}
      </button>

      {!isModifying && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800/50 space-y-4">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Advanced Features</p>
          
          {/* Monetization */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input 
                type="checkbox" 
                checked={enableMonetization}
                onChange={(e) => setEnableMonetization(e.target.checked)}
                className="w-4 h-4 rounded text-purple-main bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-purple-main focus:ring-offset-white dark:focus:ring-offset-gray-950"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Monetization (Add "Buy me a Coffee")</span>
            </label>
            {enableMonetization && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input
                  type="url"
                  value={monetizationLink}
                  onChange={(e) => setMonetizationLink(e.target.value)}
                  placeholder="https://buymeacoffee.com/username"
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main p-3 text-sm transition-colors"
                />
              </motion.div>
            )}
          </div>

          {/* Webhooks */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input 
                type="checkbox" 
                checked={enableWebhook}
                onChange={(e) => setEnableWebhook(e.target.checked)}
                className="w-4 h-4 rounded text-purple-main bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-purple-main focus:ring-offset-white dark:focus:ring-offset-gray-950"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">API Webhook Integration (e.g. Zapier, Discord)</span>
            </label>
            {enableWebhook && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.zapier.com/..."
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main p-3 text-sm transition-colors"
                />
              </motion.div>
            )}
          </div>

          {/* Multi-language */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input 
                type="checkbox" 
                checked={enableI18n}
                onChange={(e) => setEnableI18n(e.target.checked)}
                className="w-4 h-4 rounded text-purple-main bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:ring-purple-main focus:ring-offset-white dark:focus:ring-offset-gray-950"
              />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Auto-Translation (i18n Support)</span>
            </label>
            {enableI18n && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-wrap gap-2">
                {availableLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleLanguageToggle(lang.code)}
                    className={`text-xs px-3 py-1 rounded-full transition-colors border ${
                      selectedLanguages.includes(lang.code) 
                        ? 'bg-purple-main text-white border-purple-main' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      )}
    </form>
  );
});

PromptInput.displayName = 'PromptInput';

export default PromptInput;
