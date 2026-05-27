import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const FilePreview = ({ files }) => {
  const [activeTab, setActiveTab] = useState(0);

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

  return (
    <div>
      {/* File Tabs */}
      <div className="flex gap-2 border-b border-gray-800 overflow-x-auto">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === idx
                ? 'text-purple-main border-b-2 border-purple-main'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {file.filename}
          </button>
        ))}
      </div>

      {/* File Content */}
      <div className="mt-4 bg-gray-950 rounded-lg overflow-hidden">
        <SyntaxHighlighter
          language={getLanguage(files[activeTab].filename)}
          style={oneDark}
          customStyle={{
            margin: 0,
            padding: '1rem',
            maxHeight: '500px',
            overflow: 'auto',
          }}
          showLineNumbers
          wrapLines
        >
          {files[activeTab].content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default FilePreview;
