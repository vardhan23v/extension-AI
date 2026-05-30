import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Maximize2, Minimize2 } from 'lucide-react';

const BrowserFrame = ({ children, extensionTitle = 'Extension' }) => {
  const [size, setSize] = useState('popup'); // 'popup' or 'full'

  const dimensions = {
    popup: { width: '350px', height: '500px' },
    full: { width: '100%', height: '500px' },
  };

  return (
    <div className="w-full">
      {/* Size toggles */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">Live Preview</span>
        <div className="flex gap-1">
          <button
            onClick={() => setSize('popup')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${
              size === 'popup'
                ? 'bg-purple-main/10 text-purple-400 border border-purple-main/30'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            Popup
          </button>
          <button
            onClick={() => setSize('full')}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${
              size === 'full'
                ? 'bg-purple-main/10 text-purple-400 border border-purple-main/30'
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
            }`}
          >
            <Monitor className="w-3 h-3" />
            Full Width
          </button>
        </div>
      </div>

      {/* Browser frame */}
      <motion.div
        layout
        className="rounded-xl overflow-hidden border border-gray-700/50 bg-gray-900/50 shadow-2xl mx-auto"
        style={{
          maxWidth: dimensions[size].width,
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-900 border-b border-gray-800/50">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          {/* URL bar */}
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 bg-gray-800/60 rounded-lg px-3 py-1 border border-gray-700/30">
              <div className="w-3.5 h-3.5 rounded bg-purple-main/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[6px] text-purple-300 font-bold">E</span>
              </div>
              <span className="text-[11px] text-gray-400 truncate font-mono">
                chrome-extension://.../{extensionTitle.toLowerCase().replace(/\s+/g, '-')}/popup.html
              </span>
            </div>
          </div>

          {/* Window controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSize(size === 'popup' ? 'full' : 'popup')}
              className="text-gray-500 hover:text-gray-300 transition-colors"
            >
              {size === 'popup' ? (
                <Maximize2 className="w-3 h-3" />
              ) : (
                <Minimize2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Extension toolbar simulation */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 border-b border-gray-800/30">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-800/50 border border-gray-700/30">
            <div className="w-4 h-4 rounded bg-gradient-main flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">E</span>
            </div>
            <span className="text-[10px] text-gray-400 font-medium">{extensionTitle}</span>
          </div>
          <div className="flex-1" />
          <span className="text-[9px] text-gray-600 font-mono">popup.html</span>
        </div>

        {/* Content area */}
        <div
          className="bg-white overflow-hidden"
          style={{ height: size === 'popup' ? '400px' : '440px' }}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default BrowserFrame;
