import React from 'react';
import { Code2, Download, Trash2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ExtensionCard = ({ extension, onDownload, onIterate, onDelete }) => {
  const navigate = useNavigate();
  const createdDate = new Date(extension.createdAt).toLocaleDateString();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <Code2 className="w-5 h-5 text-purple-main mt-1 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-semibold text-white truncate">{extension.title}</h3>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{extension.prompt}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 text-xs text-gray-400">
        <span>{extension.fileCount} files</span>
        <span>{createdDate}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onDownload(extension.id)}
          className="flex-1 flex items-center justify-center gap-2 bg-gradient-main text-white py-2 rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
        <button
          onClick={() => onIterate(extension.id)}
          className="flex-1 flex items-center justify-center gap-2 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          <Zap className="w-4 h-4" />
          Iterate
        </button>
        <button
          onClick={() => onDelete(extension.id)}
          className="px-3 bg-red-900/20 text-red-400 py-2 rounded-lg hover:bg-red-900/40 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExtensionCard;
