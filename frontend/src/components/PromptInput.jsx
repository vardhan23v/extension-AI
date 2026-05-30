import React, { useState, useEffect, forwardRef } from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const PromptInput = forwardRef(({ onSubmit, isLoading, isModifying = false, externalPrompt, onExternalPromptConsumed }, ref) => {
  const [prompt, setPrompt] = useState('');
  const [enableMonetization, setEnableMonetization] = useState(false);
  const [monetizationLink, setMonetizationLink] = useState('');

  // Handle external prompt from Blueprint modal
  useEffect(() => {
    if (externalPrompt) {
      setPrompt(externalPrompt);
      if (onExternalPromptConsumed) onExternalPromptConsumed();
    }
  }, [externalPrompt, onExternalPromptConsumed]);

  const examplePrompts = [
    'Block all ads on YouTube',
    'Add a dark mode to any website',
    'Show word count on any page',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt, enableMonetization ? monetizationLink : null);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" ref={ref}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={isModifying ? 'Describe how you want to modify the extension...' : 'Describe your Chrome extension...'}
        className="w-full h-40 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main p-4 resize-none"
        disabled={isLoading}
      />

      {!isModifying && prompt.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">💡 Try these ideas:</p>
          <div className="flex flex-wrap gap-2">
            {examplePrompts.map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(example)}
                className="text-xs px-3 py-1 bg-gray-800 text-gray-300 rounded-full hover:bg-gray-700 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !prompt.trim()}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-opacity ${
          isLoading || !prompt.trim()
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-main text-white hover:opacity-90'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        {isModifying ? 'Apply Changes' : 'Generate Extension'}
      </button>

      {!isModifying && (
        <div className="pt-4 border-t border-gray-800/50">
          <label className="flex items-center gap-2 cursor-pointer mb-3">
            <input 
              type="checkbox" 
              checked={enableMonetization}
              onChange={(e) => setEnableMonetization(e.target.checked)}
              className="w-4 h-4 rounded text-purple-main bg-gray-800 border-gray-700 focus:ring-purple-main focus:ring-offset-gray-950"
            />
            <span className="text-sm font-medium text-gray-300">Enable Monetization (Add a "Buy me a Coffee" link)</span>
          </label>
          
          {enableMonetization && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4"
            >
              <input
                type="url"
                value={monetizationLink}
                onChange={(e) => setMonetizationLink(e.target.value)}
                placeholder="https://buymeacoffee.com/username"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-main p-3 text-sm"
              />
            </motion.div>
          )}
        </div>
      )}
    </form>
  );
});

PromptInput.displayName = 'PromptInput';

export default PromptInput;
