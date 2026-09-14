import React from 'react';
import type { FileSystem, FileSystemNode } from '../../types';
import { FileTreeNode } from './FileTreeNode';
import {
  SearchIcon,
  CloseIcon,
  FolderIcon,
  PlusFileIcon,
  PlusFolderIcon,
  FileIcon,
  SettingsIcon,
  LockIcon
} from '../common/Icons';

interface SidebarProps {
  isDark: boolean;
  sidebarOpen: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  filteredMatches: FileSystemNode[] | null;
  fileSystem: FileSystem;
  expandedFolders: Record<string, boolean>;
  activeFileId: string | null;
  renamingNodeId: string | null;
  renameValue: string;
  isReadOnly: boolean;
  onOpenDirectory: () => void;
  onToggleFolder: (folderId: string) => void;
  onSelectFile: (fileId: string) => void;
  onStartRename: (nodeId: string, currentName: string) => void;
  onRenameChange: (value: string) => void;
  onSaveRename: (nodeId: string) => void;
  onCancelRename: () => void;
  onAddFile: (parentFolderId: string) => void;
  onAddFolder: (parentFolderId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isDark,
  sidebarOpen,
  searchQuery,
  onSearchQueryChange,
  filteredMatches,
  fileSystem,
  expandedFolders,
  activeFileId,
  renamingNodeId,
  renameValue,
  isReadOnly,
  onOpenDirectory,
  onToggleFolder,
  onSelectFile,
  onStartRename,
  onRenameChange,
  onSaveRename,
  onCancelRename,
  onAddFile,
  onAddFolder,
  onDeleteNode,
  onOpenSettings
}) => {
  return (
    <aside
      className={`border-r absolute md:static top-0 bottom-0 left-0 z-20 w-72 shrink-0 transform transition-transform duration-200 flex flex-col ${
        isDark ? 'bg-slate-950/95 border-slate-800' : 'bg-white border-slate-200'
      } ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-72 md:absolute'
      }`}
    >
      <div className={`p-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="relative">
          <SearchIcon className={`absolute left-3 top-2.5 w-3.5 h-3.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className={`w-full rounded-lg pl-8 pr-8 py-1.5 text-xs focus:outline-none focus:border-indigo-500 border ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder-slate-500'
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className={`absolute right-2.5 top-2 ${
                isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CloseIcon />
            </button>
          )}
        </div>
      </div>

      <div className="px-3.5 py-2.5 flex items-center justify-between">
        {searchQuery ? (
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            Search Results
          </span>
        ) : (
          <div />
        )}
        {!searchQuery && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenDirectory}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition-colors ${
                isDark
                  ? 'bg-slate-900 hover:bg-slate-850 text-indigo-400 border-slate-800'
                  : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'
              }`}
              title="Open folder from system"
            >
              <FolderIcon className="w-3.5 h-3.5" />
              Open
            </button>
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={() => onAddFile('root')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition-colors ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-850 text-indigo-400 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'
                  }`}
                  title="Create markdown file"
                >
                  <PlusFileIcon />
                  File
                </button>
                <button
                  type="button"
                  onClick={() => onAddFolder('root')}
                  className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border transition-colors ${
                    isDark
                      ? 'bg-slate-900 hover:bg-slate-850 text-indigo-400 border-slate-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-indigo-600 border-slate-200'
                  }`}
                  title="Create folder"
                >
                  <PlusFolderIcon />
                  Folder
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        {searchQuery ? (
          filteredMatches && filteredMatches.length > 0 ? (
            <div className="space-y-0.5">
              {filteredMatches.map((node) => (
                <div
                  key={node.id}
                  onClick={() => {
                    onSelectFile(node.id);
                    onSearchQueryChange('');
                  }}
                  className={`flex items-center gap-2 py-1.5 px-3 mx-2 rounded-lg text-xs cursor-pointer ${
                    activeFileId === node.id
                      ? 'bg-indigo-600 text-white'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileIcon className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                  <span className="truncate">{node.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-8 px-4 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No matching files found.
            </div>
          )
        ) : (
          <FileTreeNode
            nodeId="root"
            fileSystem={fileSystem}
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
        )}
      </div>

      <div className={`p-3 border-t ${isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50'}`}>
        <button
          type="button"
          onClick={onOpenSettings}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
            isDark
              ? 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-800'
              : 'bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border-slate-200 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-indigo-500" />
            <span>Settings</span>
          </div>
          {isReadOnly && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              <LockIcon className="w-2.5 h-2.5" /> Read-Only
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
