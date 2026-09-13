import React from 'react';
import { LockIcon } from '../common/Icons';

interface SourceEditorProps {
  value: string;
  isReadOnly: boolean;
  isDark: boolean;
  onChange: (value: string) => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  value,
  isReadOnly,
  isDark,
  onChange
}) => {
  return (
    <div className="h-full flex flex-col p-6 max-w-5xl mx-auto w-full">
      {isReadOnly && (
        <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
          <LockIcon className="w-3.5 h-3.5" />
          <span>Read-only mode is active. Editing raw source is disabled.</span>
        </div>
      )}
      <textarea
        value={value}
        readOnly={isReadOnly}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 w-full border rounded-xl p-5 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-none leading-relaxed ${
          isReadOnly ? 'cursor-not-allowed opacity-80' : ''
        } ${
          isDark
            ? 'bg-slate-950 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
        placeholder="Write markdown here..."
      />
    </div>
  );
};
