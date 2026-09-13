import React from 'react';
import { MarkdownBlock } from './MarkdownBlock';
import { EditIcon, SaveIcon } from '../common/Icons';

interface VisualEditorProps {
  content: string;
  isDark: boolean;
  isReadOnly: boolean;
  editingBlockIndex: number | null;
  editValue: string;
  onStartEditingBlock: (index: number, rawBlockText: string) => void;
  onEditValueChange: (value: string) => void;
  onCancelEditingBlock: () => void;
  onSaveEditingBlock: (index: number) => void;
  onToggleCheckbox: (blockIdx: number, checkboxIdx: number) => void;
}

export const VisualEditor: React.FC<VisualEditorProps> = ({
  content,
  isDark,
  isReadOnly,
  editingBlockIndex,
  editValue,
  onStartEditingBlock,
  onEditValueChange,
  onCancelEditingBlock,
  onSaveEditingBlock,
  onToggleCheckbox
}) => {
  const blocks = content ? content.split(/\r?\n\r?\n+/) : [];

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 sm:px-12">
      <div className="space-y-4">
        {blocks.map((blockText, blockIdx) => {
          const isBeingEdited = editingBlockIndex === blockIdx;

          return (
            <div key={blockIdx} className="relative group rounded-xl transition-all duration-150">
              {isBeingEdited && !isReadOnly ? (
                <div
                  className={`border-2 border-indigo-500 rounded-xl p-4 shadow-xl space-y-3 relative z-10 ${
                    isDark ? 'bg-slate-950' : 'bg-white'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between border-b pb-2 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                      <EditIcon />
                      Edit Paragraph
                    </span>
                    <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      Markdown preserved on save
                    </span>
                  </div>
                  <textarea
                    value={editValue}
                    onChange={(e) => onEditValueChange(e.target.value)}
                    className={`w-full h-32 border rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-indigo-500 resize-y leading-relaxed ${
                      isDark
                        ? 'bg-slate-900 border-slate-800 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                    placeholder="Enter paragraph content..."
                    autoFocus
                  />
                  <div className="flex justify-end items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onCancelEditingBlock}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        isDark
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => onSaveEditingBlock(blockIdx)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow shadow-indigo-600/20"
                    >
                      <SaveIcon />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-3.5 border rounded-xl transition-all duration-150 relative ${
                    isDark
                      ? 'border-transparent hover:border-slate-800 hover:bg-slate-950/30'
                      : 'border-transparent hover:border-slate-200 hover:bg-white/80'
                  }`}
                >
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onStartEditingBlock(blockIdx, blockText)}
                      className={`absolute right-3 top-3 opacity-0 group-hover:opacity-100 px-2.5 py-1 rounded-md border transition-all duration-150 shadow-md flex items-center gap-1.5 text-xs font-semibold z-10 ${
                        isDark
                          ? 'bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 border-slate-800'
                          : 'bg-white hover:bg-slate-50 text-indigo-600 hover:text-indigo-700 border-slate-200'
                      }`}
                      title="Edit this paragraph"
                    >
                      <EditIcon />
                      <span>Edit</span>
                    </button>
                  )}
                  <MarkdownBlock
                    blockText={blockText}
                    blockIdx={blockIdx}
                    isDark={isDark}
                    isReadOnly={isReadOnly}
                    onToggleCheckbox={onToggleCheckbox}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
