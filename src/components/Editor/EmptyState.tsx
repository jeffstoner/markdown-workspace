import React from 'react';
import { LogoIcon, PlusFileIcon } from '../common/Icons';

interface EmptyStateProps {
  isDark: boolean;
  isReadOnly: boolean;
  onCreateFile: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  isDark,
  isReadOnly,
  onCreateFile
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div
        className={`p-4 rounded-2xl border shadow-xl mb-4 text-indigo-500 ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <LogoIcon className="w-10 h-10" />
      </div>
      <h3 className={`text-base font-bold mb-1 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
        No File Selected
      </h3>
      <p className={`text-xs mb-5 leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        Select a file from the explorer on the left or create a new document to begin.
      </p>
      {!isReadOnly && (
        <button
          type="button"
          onClick={onCreateFile}
          className="flex items-center justify-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
        >
          <PlusFileIcon />
          Create New File
        </button>
      )}
    </div>
  );
};
