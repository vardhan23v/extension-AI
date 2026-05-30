import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const PromptInput = ({ onSubmit, isLoading, isModifying = false }) => {
  const [prompt, setPrompt] = useState('');

  const examplePrompts = [
    'Block all ads on YouTube',
    'Add a dark mode to any website',
    'Show word count on any page',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      {isLoading && <LoadingSpinner message="Creating your extension..." />}
    </form>
  );
};

export default PromptInput;
