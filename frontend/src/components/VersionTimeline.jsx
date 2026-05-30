import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RotateCcw, MessageSquare, Bug, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

const VersionTimeline = ({ history = [], onRestore, isLoading }) => {
  const [expanded, setExpanded] = React.useState(false);

  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">No version history yet</p>
        <p className="text-gray-500 text-sm mt-1">Each modification creates a new version</p>
      </div>
    );
  }

  const displayHistory = expanded ? history : history.slice(0, 5);
  const hasMore = history.length > 5;

  const getIcon = (prompt) => {
    if (prompt.startsWith('DEBUG:')) return <Bug className="w-3.5 h-3.5" />;
    if (prompt.startsWith('Cloned')) return <Sparkles className="w-3.5 h-3.5" />;
    return <MessageSquare className="w-3.5 h-3.5" />;
  };

  const formatPrompt = (prompt) => {
    if (prompt.startsWith('DEBUG: ')) return prompt.replace('DEBUG: ', '');
    return prompt;
  };

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Version History
          <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-0.5 rounded-full">
            {history.length} versions
          </span>
        </h4>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-gray-800/80" />

        <AnimatePresence>
          {displayHistory.map((entry, idx) => {
            const isCurrent = idx === history.length - 1;
            const isDebug = entry.prompt?.startsWith('DEBUG:');
            const formattedDate = new Date(entry.timestamp).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex gap-3 py-3 relative"
              >
                {/* Node */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    isCurrent
                      ? 'bg-purple-main/20 border-2 border-purple-main timeline-node-active text-purple-400'
                      : isDebug
                      ? 'bg-rose-500/10 border-2 border-rose-500/30 text-rose-400'
                      : 'bg-gray-800/80 border-2 border-gray-700 text-gray-400'
                  }`}
                >
                  {getIcon(entry.prompt || '')}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-500">
                      v{idx + 1}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-main/10 text-purple-400 border border-purple-main/20 font-medium">
                        Current
                      </span>
                    )}
                    {isDebug && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                        Bug Fix
                      </span>
                    )}
                    <span className="text-[10px] text-gray-600">{formattedDate}</span>
                  </div>

                  <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                    {formatPrompt(entry.prompt || 'Initial generation')}
                  </p>

                  {!isCurrent && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onRestore(entry.prompt)}
                      disabled={isLoading}
                      className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Restore this version
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" /> Show {history.length - 5} more
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default VersionTimeline;
