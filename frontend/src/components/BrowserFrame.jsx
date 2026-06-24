import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Maximize2, Minimize2, RotateCw, ExternalLink } from 'lucide-react';

const BrowserFrame = ({ children, extensionTitle = 'Extension', iframeSrcDoc = '' }) => {
  const [size, setSize] = useState('popup'); // 'popup', 'tablet', 'full'
  const [refreshKey, setRefreshKey] = useState(0);

  const dimensions = {
    popup: { width: '350px', height: '500px', contentHeight: '400px' },
    tablet: { width: '480px', height: '550px', contentHeight: '450px' },
    full: { width: '100%', height: '550px', contentHeight: '450px' },
  };

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleOpenNewTab = useCallback(() => {
    if (!iframeSrcDoc) return;
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(iframeSrcDoc);
      newWindow.document.close();
    }
  }, [iframeSrcDoc]);

  const sizeOptions = [
    { id: 'popup', label: 'Popup', icon: Smartphone, width: '350px' },
    { id: 'tablet', label: 'Tablet', icon: Tablet, width: '480px' },
    { id: 'full', label: 'Full Width', icon: Monitor, width: '100%' },
  ];

  return (
    <div className="w-full">
      {/* Size toggles + action buttons */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500 font-medium">Live Preview</span>
        <div className="flex items-center gap-1">
          {/* Viewport sizes */}
          {sizeOptions.map((opt) => {
            const SizeIcon = opt.icon;
            const isActive = size === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSize(opt.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  isActive
                    ? 'bg-purple-main/10 text-purple-400 border border-purple-main/30'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                }`}
                title={`${opt.label} (${opt.width})`}
              >
                <SizeIcon className="w-3 h-3" />
                {opt.label}
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-4 bg-gray-700/50 mx-1" />

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
            title="Refresh preview"
          >
            <RotateCw className="w-3 h-3" />
          </button>

          {/* Open in new tab */}
          {iframeSrcDoc && (
            <button
              onClick={handleOpenNewTab}
              className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800/50 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Browser frame */}
      <motion.div
        layout
        className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-900/50 shadow-2xl mx-auto"
        style={{
          maxWidth: dimensions[size].width,
          transition: 'max-width 0.3s ease',
        }}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-3 py-2.5 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800/50">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>

          {/* URL bar */}
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800/60 rounded-lg px-3 py-1 border border-gray-200 dark:border-gray-700/30">
              <div className="w-3.5 h-3.5 rounded bg-purple-main/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[6px] text-purple-500 dark:text-purple-300 font-bold">E</span>
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
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {size === 'full' ? (
                <Minimize2 className="w-3 h-3" />
              ) : (
                <Maximize2 className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Extension toolbar simulation */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800/30">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/30">
            <div className="w-4 h-4 rounded bg-gradient-main flex items-center justify-center">
              <span className="text-[7px] text-white font-bold">E</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{extensionTitle}</span>
          </div>
          <div className="flex-1" />
          <span className="text-[9px] text-gray-400 dark:text-gray-600 font-mono">
            {dimensions[size].width === '100%' ? 'full' : dimensions[size].width}
          </span>
        </div>

        {/* Content area */}
        <div
          className="bg-white overflow-hidden"
          style={{ height: dimensions[size].contentHeight }}
          key={refreshKey}
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default BrowserFrame;
