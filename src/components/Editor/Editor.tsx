import React from 'react';
import type { FileSystemNode, ViewMode, FileStats } from '../../types';
import { VisualEditor } from './VisualEditor';
import { SourceEditor } from './SourceEditor';
import { EditorStats } from './EditorStats';
import { EmptyState } from './EmptyState';
import { FileIcon, LockIcon } from '../common/Icons';

interface EditorProps {
  activeFile: FileSystemNode | null;
  viewMode: ViewMode;
  isDark: boolean;
  isReadOnly: boolean;
  fileStats: FileStats | null;
  rawTextValue: string;
  onRawTextChange: (value: string) => void;
  editingBlockIndex: number | null;
  editValue: string;
  onStartEditingBlock: (index: number, rawBlockText: string) => void;
  onEditValueChange: (value: string) => void;
  onCancelEditingBlock: () => void;
  onSaveEditingBlock: (index: number) => void;
  onToggleCheckbox: (blockIdx: number, checkboxIdx: number) => void;
  onCreateFile: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  activeFile,
  viewMode,
  isDark,
  isReadOnly,
  fileStats,
  rawTextValue,
  onRawTextChange,
  editingBlockIndex,
  editValue,
  onStartEditingBlock,
  onEditValueChange,
  onCancelEditingBlock,
  onSaveEditingBlock,
  onToggleCheckbox,
  onCreateFile
}) => {
  return (
    <main className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {activeFile ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div
            className={`border-b px-6 py-2.5 flex items-center justify-between ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden mr-4 text-xs">
              <span className={`uppercase tracking-wider font-semibold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                WORKSPACE
              </span>
              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>/</span>
              <div className="flex items-center gap-1.5 overflow-hidden">
                <FileIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className={`font-bold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {activeFile.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs shrink-0">
              {isReadOnly ? (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                  <LockIcon className="w-3 h-3" /> Locked
                </span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded border ${
                    isDark
                      ? 'bg-slate-850 text-slate-400 border-slate-800'
                      : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}
                >
                  Auto-saved
                </span>
              )}
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
            {viewMode === 'visual' ? (
              <VisualEditor
                content={activeFile.content || ''}
                isDark={isDark}
                isReadOnly={isReadOnly}
                editingBlockIndex={editingBlockIndex}
                editValue={editValue}
                onStartEditingBlock={onStartEditingBlock}
                onEditValueChange={onEditValueChange}
                onCancelEditingBlock={onCancelEditingBlock}
                onSaveEditingBlock={onSaveEditingBlock}
                onToggleCheckbox={onToggleCheckbox}
              />
            ) : (
              <SourceEditor
                value={rawTextValue}
                isReadOnly={isReadOnly}
                isDark={isDark}
                onChange={onRawTextChange}
              />
            )}
          </div>

          {fileStats && <EditorStats stats={fileStats} isDark={isDark} />}
        </div>
      ) : (
        <EmptyState isDark={isDark} isReadOnly={isReadOnly} onCreateFile={onCreateFile} />
      )}
    </main>
  );
};
