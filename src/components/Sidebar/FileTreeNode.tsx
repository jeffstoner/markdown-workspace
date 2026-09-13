import React from 'react';
import type { FileSystem } from '../../types';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  FolderIcon,
  FileIcon,
  PlusFileIcon,
  PlusFolderIcon,
  RenameIcon,
  TrashIcon
} from '../common/Icons';

interface FileTreeNodeProps {
  nodeId: string;
  fileSystem: FileSystem;
  level?: number;
  isDark: boolean;
  isReadOnly: boolean;
  expandedFolders: Record<string, boolean>;
  activeFileId: string | null;
  renamingNodeId: string | null;
  renameValue: string;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
  onStartRename: (nodeId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onSaveRename: (nodeId: string) => void;
  onCancelRename: () => void;
  onAddFile: (parentFolderId: string) => void;
  onAddFolder: (parentFolderId: string) => void;
  onDeleteNode: (nodeId: string) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  nodeId,
  fileSystem,
  level = 0,
  isDark,
  isReadOnly,
  expandedFolders,
  activeFileId,
  renamingNodeId,
  renameValue,
  onToggleFolder,
  onSelectFile,
  onStartRename,
  onRenameChange,
  onSaveRename,
  onCancelRename,
  onAddFile,
  onAddFolder,
  onDeleteNode
}) => {
  const node = fileSystem[nodeId];
  if (!node) return null;

  const isFolder = node.type === 'folder';
  const isExpanded = expandedFolders[nodeId];
  const isSelected = activeFileId === nodeId;
  const isRenaming = renamingNodeId === nodeId;
  const paddingLeft = level * 16 + 12;

  return (
    <div className="select-none">
      <div
        className={`group flex items-center justify-between py-1.5 px-3 mx-2 my-0.5 rounded-lg text-sm cursor-pointer transition-all duration-150 ${
          isSelected
            ? 'bg-indigo-600/20 text-indigo-500 dark:text-white border-l-2 border-indigo-500 font-medium'
            : isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => {
          if (isFolder) {
            onToggleFolder(nodeId);
          } else {
            onSelectFile(nodeId);
          }
        }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
          {isFolder && (
            <span className={isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}>
              {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
            </span>
          )}

          {isFolder ? (
            <FolderIcon
              className={`w-4 h-4 shrink-0 ${
                isExpanded ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
          ) : (
            <FileIcon
              className={`w-4 h-4 shrink-0 ${
                isSelected ? 'text-indigo-500' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            />
          )}

          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={(e) => onRenameChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSaveRename(nodeId);
                if (e.key === 'Escape') onCancelRename();
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onBlur={() => onSaveRename(nodeId)}
              className={`border border-indigo-500 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none ${
                isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'
              }`}
            />
          ) : (
            <span className="truncate text-xs">{node.name}</span>
          )}
        </div>

        {!isRenaming && !isReadOnly && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <>
                <button
                  type="button"
                  title="Add File"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFile(nodeId);
                  }}
                  className={`p-1 rounded ${
                    isDark
                      ? 'hover:bg-slate-700 text-slate-400 hover:text-indigo-400'
                      : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <PlusFileIcon />
                </button>
                <button
                  type="button"
                  title="Add Folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddFolder(nodeId);
                  }}
                  className={`p-1 rounded ${
                    isDark
                      ? 'hover:bg-slate-700 text-slate-400 hover:text-indigo-400'
                      : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <PlusFolderIcon />
                </button>
              </>
            )}
            <button
              type="button"
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                onStartRename(nodeId, node.name);
              }}
              className={`p-1 rounded ${
                isDark
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-emerald-400'
                  : 'hover:bg-slate-200 text-slate-500 hover:text-emerald-600'
              }`}
            >
              <RenameIcon />
            </button>
            {nodeId !== 'root' && (
              <button
                type="button"
                title="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteNode(nodeId);
                }}
                className={`p-1 rounded ${
                  isDark
                    ? 'hover:bg-slate-700 text-slate-400 hover:text-rose-400'
                    : 'hover:bg-slate-200 text-slate-500 hover:text-rose-600'
                }`}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}
      </div>

      {isFolder && isExpanded && node.children && (
        <div className="mt-0.5">
          {node.children.map((childId) => (
            <FileTreeNode
              key={childId}
              nodeId={childId}
              fileSystem={fileSystem}
              level={level + 1}
              isDark={isDark}
              isReadOnly={isReadOnly}
              expandedFolders={expandedFolders}
              activeFileId={activeFileId}
              renamingNodeId={renamingNodeId}
              renameValue={renameValue}
              onToggleFolder={onToggleFolder}
              onSelectFile={onSelectFile}
              onStartRename={onStartRename}
              onRenameChange={onRenameChange}
              onSaveRename={onSaveRename}
              onCancelRename={onCancelRename}
              onAddFile={onAddFile}
              onAddFolder={onAddFolder}
              onDeleteNode={onDeleteNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
