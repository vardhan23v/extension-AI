import React, { useState, useRef, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Pencil, Eye, Save, FileJson, FileCode, FileText, FileType, Copy } from 'lucide-react';

const FilePreview = ({ files, onFilesChange }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [hasEdits, setHasEdits] = useState(false);
  const textareaRef = useRef(null);

  if (!files || files.length === 0) {
    return <p className="text-gray-400">No files to preview</p>;
  }

  const getLanguage = (filename) => {
    if (filename.endsWith('.json')) return 'json';
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    return 'text';
  };

  const getFileIcon = (filename) => {
    if (filename.endsWith('.json')) return <FileJson className="w-3.5 h-3.5 text-amber-400" />;
    if (filename.endsWith('.js')) return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
    if (filename.endsWith('.html')) return <FileType className="w-3.5 h-3.5 text-orange-400" />;
    if (filename.endsWith('.css')) return <FileText className="w-3.5 h-3.5 text-blue-400" />;
    return <FileText className="w-3.5 h-3.5 text-gray-400" />;
  };

  const startEditing = () => {
    setEditContent(files[activeTab].content);
    setEditMode(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const stopEditing = () => {
    setEditMode(false);
  };

  const saveEdits = () => {
    if (onFilesChange) {
      const updatedFiles = files.map((f, idx) =>
        idx === activeTab ? { ...f, content: editContent } : f
      );
      onFilesChange(updatedFiles);
      setHasEdits(true);
    }
    setEditMode(false);
  };

  const handleTabChange = (idx) => {
    if (editMode) {
      // Save current edits before switching
      saveEdits();
    }
    setActiveTab(idx);
    setEditMode(false);
  };

  const handleCopy = () => {
    if (files[activeTab]) {
      navigator.clipboard.writeText(files[activeTab].content);
      toast.success('Copied to clipboard!');
    }
  };

  const handleKeyDown = (e) => {
    // Tab key inserts 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const val = editContent;
      setEditContent(val.substring(0, start) + '  ' + val.substring(end));
      // Restore cursor
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  const lineCount = editMode
    ? editContent.split('\n').length
    : (files[activeTab]?.content || '').split('\n').length;

  return (
    <div>
      {/* File Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 mb-0">
        <motion.div 
          className="flex gap-1 overflow-x-auto flex-1"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {files.map((file, idx) => (
            <motion.button
              key={idx}
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 }
              }}
              onClick={() => handleTabChange(idx)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === idx
                  ? 'text-purple-600 dark:text-purple-main border-b-2 border-purple-600 dark:border-purple-main bg-purple-50 dark:bg-gray-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
              }`}
            >
              {getFileIcon(file.filename)}
              {file.filename}
            </motion.button>
          ))}
        </motion.div>

        {/* Edit toggle */}
        <div className="flex items-center gap-1.5 px-2 flex-shrink-0">
          {editMode ? (
            <>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveEdits}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors font-medium"
              >
                <Save className="w-3 h-3" /> Save
              </motion.button>
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={stopEditing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Eye className="w-3 h-3" /> Preview
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors border border-gray-200 dark:border-gray-700/50 rounded-lg hover:border-blue-300 dark:hover:border-blue-400/30"
              >
                <Copy className="w-3 h-3" /> Copy
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startEditing}
                className="flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors border border-gray-200 dark:border-gray-700/50 rounded-lg hover:border-purple-300 dark:hover:border-purple-main/30"
              >
                <Pencil className="w-3 h-3" /> Edit
              </motion.button>
            </>
          )}

          {hasEdits && !editMode && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              Edited
            </span>
          )}
        </div>
      </div>

      {/* File Content */}
      <div className="mt-0 bg-gray-950 rounded-b-lg overflow-hidden relative">
        <AnimatePresence mode="wait">
          {editMode ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              {/* Line numbers gutter */}
              <div className="bg-gray-900/80 border-r border-gray-800/50 px-2 py-4 select-none text-right min-w-[3.5rem] overflow-hidden">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="text-[11px] text-gray-600 leading-[1.45rem] font-mono">
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* Editable textarea */}
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 bg-transparent text-gray-200 font-mono text-[13px] leading-[1.45rem] p-4 resize-none focus:outline-none min-h-[400px] max-h-[500px] overflow-auto"
                style={{ tabSize: 2 }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SyntaxHighlighter
                language={getLanguage(files[activeTab].filename)}
                style={oneDark}
                customStyle={{
                  margin: 0,
                  padding: '1rem',
                  maxHeight: '500px',
                  overflow: 'auto',
                  background: 'transparent',
                }}
                showLineNumbers
                wrapLines
              >
                {files[activeTab].content}
              </SyntaxHighlighter>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FilePreview;
