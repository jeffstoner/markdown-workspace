import React from 'react';
import type { ViewMode, FileSystemNode } from '../../types';
import { HamburgerIcon, LogoIcon, LockIcon, EyeIcon, CodeIcon } from '../common/Icons';

interface HeaderProps {
  isDark: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  isReadOnly: boolean;
  activeFile: FileSystemNode | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  version?: string;
}

export const Header: React.FC<HeaderProps> = ({
  isDark,
  sidebarOpen,
  onToggleSidebar,
  isReadOnly,
  activeFile,
  viewMode,
  onViewModeChange,
  version = 'v1.0.2'
}) => {
  return (
    <header
      className={`h-14 px-4 flex items-center justify-between sticky top-0 z-30 border-b ${
        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-colors ${
            isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Toggle Sidebar"
        >
          <HamburgerIcon />
        </button>

        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-md shadow-indigo-600/20">
            <LogoIcon />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`font-bold text-sm tracking-wide ${isDark ? 'text-white' : 'text-slate-900'}`}>MARKDOWN</span>
            <span
              className={`font-extrabold text-[10px] px-1.5 py-0.5 rounded border tracking-wide ${
                isDark ? 'text-indigo-400 bg-indigo-950/80 border-indigo-900/50' : 'text-indigo-600 bg-indigo-50 border-indigo-200'
              }`}
            >
              WORKSPACE {version}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <LockIcon />
            <span>Read-Only Mode</span>
          </div>
        )}

        {activeFile && (
          <div
            className={`flex p-1 rounded-lg border ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <button
              type="button"
              onClick={() => onViewModeChange('visual')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'visual'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <EyeIcon />
              Visual View
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('source')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'source'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <CodeIcon />
              Raw Source
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
