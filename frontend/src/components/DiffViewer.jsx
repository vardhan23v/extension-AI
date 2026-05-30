import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Columns, Rows } from 'lucide-react';

// Simple LCS-based line diff — no external library required
function computeDiff(oldText, newText) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find diff
  const result = [];
  let i = m,
    j = n;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      result.unshift({ type: 'unchanged', line: oldLines[i - 1], oldNum: i, newNum: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'add', line: newLines[j - 1], newNum: j });
      j--;
    } else {
      result.unshift({ type: 'remove', line: oldLines[i - 1], oldNum: i });
      i--;
    }
  }

  return result;
}

const DiffViewer = ({ oldFiles = [], newFiles = [] }) => {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [viewMode, setViewMode] = useState('unified'); // 'unified' or 'split'

  // Find all files that changed or were added/removed
  const fileDiffs = useMemo(() => {
    const allFilenames = new Set([
      ...oldFiles.map((f) => f.filename),
      ...newFiles.map((f) => f.filename),
    ]);

    return Array.from(allFilenames).map((filename) => {
      const oldFile = oldFiles.find((f) => f.filename === filename);
      const newFile = newFiles.find((f) => f.filename === filename);
      const oldContent = oldFile?.content || '';
      const newContent = newFile?.content || '';
      const hasChanges = oldContent !== newContent;

      return {
        filename,
        status: !oldFile ? 'added' : !newFile ? 'removed' : hasChanges ? 'modified' : 'unchanged',
        diff: hasChanges || !oldFile || !newFile ? computeDiff(oldContent, newContent) : [],
        oldContent,
        newContent,
      };
    }).filter((f) => f.status !== 'unchanged');
  }, [oldFiles, newFiles]);

  if (fileDiffs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <GitCompare className="w-12 h-12 text-gray-600 mb-4" />
        <p className="text-gray-400 font-medium">No changes to display</p>
        <p className="text-gray-500 text-sm mt-1">Modify your extension to see the diff here</p>
      </div>
    );
  }

  const currentDiff = fileDiffs[activeFileIdx] || fileDiffs[0];

  const statusBadge = (status) => {
    const styles = {
      added: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      removed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      modified: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    };
    return (
      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const addCount = currentDiff.diff.filter((d) => d.type === 'add').length;
  const removeCount = currentDiff.diff.filter((d) => d.type === 'remove').length;

  return (
    <div>
      {/* File tabs + view toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 overflow-x-auto flex-1">
          {fileDiffs.map((file, idx) => (
            <button
              key={file.filename}
              onClick={() => setActiveFileIdx(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                idx === activeFileIdx
                  ? 'bg-purple-main/10 text-purple-400 border border-purple-main/30'
                  : 'text-gray-400 hover:text-white bg-gray-800/30 border border-transparent'
              }`}
            >
              {file.filename}
              {statusBadge(file.status)}
            </button>
          ))}
        </div>

        <div className="flex gap-1 ml-3 flex-shrink-0">
          <button
            onClick={() => setViewMode('unified')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'unified' ? 'bg-purple-main/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Unified view"
          >
            <Rows className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'split' ? 'bg-purple-main/20 text-purple-400' : 'text-gray-500 hover:text-gray-300'
            }`}
            title="Split view"
          >
            <Columns className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <span className="text-emerald-400">+{addCount} additions</span>
        <span className="text-rose-400">−{removeCount} deletions</span>
      </div>

      {/* Diff content */}
      <div className="bg-gray-950 rounded-lg border border-gray-800/50 overflow-hidden max-h-[500px] overflow-y-auto">
        {viewMode === 'unified' ? (
          <table className="w-full text-xs font-mono">
            <tbody>
              {currentDiff.diff.map((entry, idx) => (
                <tr
                  key={idx}
                  className={
                    entry.type === 'add'
                      ? 'diff-add'
                      : entry.type === 'remove'
                      ? 'diff-remove'
                      : 'diff-unchanged'
                  }
                >
                  <td className="px-2 py-0.5 text-gray-500 select-none w-10 text-right border-r border-gray-800/30">
                    {entry.oldNum || ''}
                  </td>
                  <td className="px-2 py-0.5 text-gray-500 select-none w-10 text-right border-r border-gray-800/30">
                    {entry.newNum || ''}
                  </td>
                  <td className="px-2 py-0.5 select-none w-6 text-center">
                    {entry.type === 'add' ? (
                      <span className="text-emerald-400">+</span>
                    ) : entry.type === 'remove' ? (
                      <span className="text-rose-400">−</span>
                    ) : (
                      ''
                    )}
                  </td>
                  <td className="px-2 py-0.5 whitespace-pre text-gray-300">
                    {entry.line}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-gray-800/30">
            {/* Old side */}
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-900/50 border-b border-gray-800/30">
                Previous
              </div>
              <table className="w-full text-xs font-mono">
                <tbody>
                  {currentDiff.diff
                    .filter((d) => d.type !== 'add')
                    .map((entry, idx) => (
                      <tr
                        key={idx}
                        className={entry.type === 'remove' ? 'diff-remove' : 'diff-unchanged'}
                      >
                        <td className="px-2 py-0.5 text-gray-500 select-none w-8 text-right border-r border-gray-800/30">
                          {entry.oldNum || ''}
                        </td>
                        <td className="px-2 py-0.5 whitespace-pre text-gray-300 overflow-hidden">
                          {entry.line}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {/* New side */}
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-500 bg-gray-900/50 border-b border-gray-800/30">
                Current
              </div>
              <table className="w-full text-xs font-mono">
                <tbody>
                  {currentDiff.diff
                    .filter((d) => d.type !== 'remove')
                    .map((entry, idx) => (
                      <tr
                        key={idx}
                        className={entry.type === 'add' ? 'diff-add' : 'diff-unchanged'}
                      >
                        <td className="px-2 py-0.5 text-gray-500 select-none w-8 text-right border-r border-gray-800/30">
                          {entry.newNum || ''}
                        </td>
                        <td className="px-2 py-0.5 whitespace-pre text-gray-300 overflow-hidden">
                          {entry.line}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiffViewer;
