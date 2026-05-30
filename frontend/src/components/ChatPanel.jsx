import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, Sparkles, FileCode } from 'lucide-react';

const ChatPanel = ({ extensionId, extensionTitle, onIterate, isLoading }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Call the iterate function from parent
    onIterate(trimmed, (responseExtension) => {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'ai',
        text: `Updated **${responseExtension?.title || extensionTitle}** with your changes.`,
        filesChanged: responseExtension?.files?.length || 0,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50">
        <div className="w-7 h-7 rounded-lg bg-purple-main/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-purple-main" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
          <p className="text-xs text-gray-500">Ask to modify your extension</p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[200px] max-h-[350px]"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-gray-500 text-sm max-w-[220px]">
              Describe changes you'd like to make to your extension
            </p>
            <div className="mt-4 space-y-2 w-full">
              {[
                'Add a settings page',
                'Make the popup wider',
                'Add keyboard shortcuts',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(suggestion)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300 transition-colors border border-gray-800/50"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`chat-bubble flex gap-2.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-blue-main/20'
                    : 'bg-purple-main/20'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-purple-400" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-blue-main/10 border border-blue-main/20 text-blue-100'
                    : 'bg-gray-800/60 border border-gray-700/50 text-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                {msg.filesChanged && (
                  <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-gray-700/30">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400">
                      {msg.filesChanged} files updated
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-2.5"
          >
            <div className="w-7 h-7 rounded-full bg-purple-main/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 rounded-full bg-purple-400"
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-800/50">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your changes..."
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm placeholder-gray-500 px-3.5 py-2.5 resize-none focus:outline-none focus:border-purple-main/50 focus:ring-1 focus:ring-purple-main/20 disabled:opacity-50"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-xl bg-gradient-main flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
