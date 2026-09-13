import React from 'react';
import type { FileStats } from '../../types';

interface EditorStatsProps {
  stats: FileStats | null;
  isDark: boolean;
}

export const EditorStats: React.FC<EditorStatsProps> = ({ stats, isDark }) => {
  if (!stats) return null;

  return (
    <footer
      className={`border-t px-4 py-2 flex flex-wrap items-center justify-between gap-2.5 text-xs ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-500'
      }`}
    >
      <div className="flex items-center gap-4 flex-wrap">
        <span>
          <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{stats.lines}</strong> lines
        </span>
        <span>
          <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{stats.words}</strong> words
        </span>
        <span>
          <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{stats.chars}</strong> characters
        </span>
      </div>

      {stats.totalChecks > 0 && (
        <div
          className={`flex items-center gap-2 border px-2.5 py-0.5 rounded-md ${
            isDark ? 'bg-indigo-950/30 border-indigo-900/40' : 'bg-indigo-50 border-indigo-200'
          }`}
        >
          <span className={`font-medium ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
            Checklist: {stats.completedChecks} / {stats.totalChecks} completed
          </span>
          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {stats.completionRate}%
          </span>
        </div>
      )}
    </footer>
  );
};
