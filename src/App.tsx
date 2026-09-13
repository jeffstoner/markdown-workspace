import React, { useState, useEffect, useMemo } from 'react';
import type { FileSystem, FileSystemNode, ViewMode, ThemeSetting } from './types';
import { initialFileSystem } from './data/initialFileSystem';
import { calculateFileStats } from './utils/markdown';
import { openSystemDirectory } from './utils/directoryPicker';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Editor } from './components/Editor/Editor';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Toast } from './components/common/Toast';

export default function App() {
  const [fileSystem, setFileSystem] = useState<FileSystem>(initialFileSystem);
  const [activeFileId, setActiveFileId] = useState<string | null>('welcome');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    root: true
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [rawTextValue, setRawTextValue] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const { themeSetting, setThemeSetting, isDark } = useTheme('dark');

  useEffect(() => {
    if (activeFileId && fileSystem[activeFileId]) {
      setRawTextValue(fileSystem[activeFileId].content || '');
      setEditingBlockIndex(null);
    }
  }, [activeFileId, fileSystem]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  const handleAddFile = (parentFolderId: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    const newId = `file_${Date.now()}`;
    const newFile: FileSystemNode = {
      id: newId,
      name: 'New Document.md',
      type: 'file',
      content: '# New Document\n\nHover here and click the pencil to edit this block!'
    };

    setFileSystem((prev) => {
      const parent = prev[parentFolderId];
      if (!parent) return prev;
      return {
        ...prev,
        [newId]: newFile,
        [parentFolderId]: {
          ...parent,
          children: [...(parent.children || []), newId]
        }
      };
    });

    setActiveFileId(newId);
    setExpandedFolders((prev) => ({ ...prev, [parentFolderId]: true }));
    triggerToast('New Markdown file created');
  };

  const handleAddFolder = (parentFolderId: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    const newId = `folder_${Date.now()}`;
    const newFolder: FileSystemNode = {
      id: newId,
      name: 'New Folder',
      type: 'folder',
      children: []
    };

    setFileSystem((prev) => {
      const parent = prev[parentFolderId];
      if (!parent) return prev;
      return {
        ...prev,
        [newId]: newFolder,
        [parentFolderId]: {
          ...parent,
          children: [...(parent.children || []), newId]
        }
      };
    });

    setExpandedFolders((prev) => ({ ...prev, [parentFolderId]: true, [newId]: true }));
    triggerToast('New folder created');
  };

  const handleDeleteNode = (idToDelete: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    if (idToDelete === 'root') return;

    setFileSystem((prev) => {
      const copy = { ...prev };

      const collectDescendants = (id: string): string[] => {
        let list = [id];
        if (copy[id] && copy[id].type === 'folder' && copy[id].children) {
          copy[id].children!.forEach((cid) => {
            list = [...list, ...collectDescendants(cid)];
          });
        }
        return list;
      };

      const idsToRemove = collectDescendants(idToDelete);
      idsToRemove.forEach((id) => delete copy[id]);

      Object.keys(copy).forEach((parentId) => {
        const parent = copy[parentId];
        if (parent && parent.type === 'folder' && parent.children) {
          copy[parentId] = {
            ...parent,
            children: parent.children.filter((cid) => cid !== idToDelete)
          };
        }
      });

      return copy;
    });

    if (activeFileId === idToDelete) {
      setActiveFileId(null);
    }
    triggerToast('Item removed');
  };

  const handleStartRename = (nodeId: string, currentName: string) => {
    setRenamingNodeId(nodeId);
    setRenameValue(currentName);
  };

  const handleCancelRename = () => {
    setRenamingNodeId(null);
  };

  const handleSaveRename = (nodeId: string) => {
    if (isReadOnly) {
      setRenamingNodeId(null);
      return;
    }
    if (!renameValue.trim()) {
      setRenamingNodeId(null);
      return;
    }

    let finalName = renameValue.trim();
    if (fileSystem[nodeId] && fileSystem[nodeId].type === 'file' && !finalName.endsWith('.md')) {
      finalName += '.md';
    }

    setFileSystem((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        name: finalName
      }
    }));

    setRenamingNodeId(null);
    triggerToast('Renamed successfully');
  };

  const handleRawTextChange = (newVal: string) => {
    if (isReadOnly) return;
    setRawTextValue(newVal);
    if (activeFileId) {
      setFileSystem((prev) => ({
        ...prev,
        [activeFileId]: {
          ...prev[activeFileId],
          content: newVal
        }
      }));
    }
  };

  const startEditingBlock = (index: number, rawBlockText: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    setEditingBlockIndex(index);
    setEditValue(rawBlockText);
  };

  const cancelEditingBlock = () => {
    setEditingBlockIndex(null);
    setEditValue('');
  };

  const saveEditingBlock = (index: number) => {
    if (isReadOnly) {
      setEditingBlockIndex(null);
      return;
    }
    if (!activeFileId || !fileSystem[activeFileId]) return;
    const file = fileSystem[activeFileId];
    const blocks = (file.content || '').split(/\r?\n\r?\n+/);

    blocks[index] = editValue;
    const newContent = blocks.join('\n\n');

    setFileSystem((prev) => ({
      ...prev,
      [activeFileId]: {
        ...prev[activeFileId],
        content: newContent
      }
    }));

    setEditingBlockIndex(null);
    setEditValue('');
    triggerToast('Block updated successfully');
  };

  const toggleCheckbox = (blockIdx: number, lineIndexOrCheckboxIdx: number) => {
    if (isReadOnly) {
      triggerToast('Read-only mode: Cannot toggle tasks');
      return;
    }
    if (!activeFileId || !fileSystem[activeFileId]) return;
    const file = fileSystem[activeFileId];
    const blocks = (file.content || '').split(/\r?\n\r?\n+/);
    if (blockIdx < 0 || blockIdx >= blocks.length) return;
    const blockText = blocks[blockIdx];

    const lines = blockText.split(/\r?\n/);
    const checkboxRegex = /^(\s*[-\*\+]\s+\[)([ xX])(\].*)$/;

    let toggled = false;
    // 1. Direct line-index lookup (fast, exact, robust across re-renders)
    if (lineIndexOrCheckboxIdx >= 0 && lineIndexOrCheckboxIdx < lines.length) {
      const match = lines[lineIndexOrCheckboxIdx].match(checkboxRegex);
      if (match) {
        const currentStatus = match[2].toLowerCase();
        const newStatus = currentStatus === 'x' ? ' ' : 'x';
        lines[lineIndexOrCheckboxIdx] = `${match[1]}${newStatus}${match[3]}`;
        toggled = true;
      }
    }

    // 2. Fallback: ordinal checkbox lookup if target was not a direct line index
    if (!toggled) {
      let currentCheckboxIdx = 0;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(checkboxRegex);
        if (match) {
          if (currentCheckboxIdx === lineIndexOrCheckboxIdx) {
            const currentStatus = match[2].toLowerCase();
            const newStatus = currentStatus === 'x' ? ' ' : 'x';
            lines[i] = `${match[1]}${newStatus}${match[3]}`;
            toggled = true;
            break;
          }
          currentCheckboxIdx++;
        }
      }
    }

    if (!toggled) return;

    blocks[blockIdx] = lines.join('\n');
    const newContent = blocks.join('\n\n');

    setFileSystem((prev) => ({
      ...prev,
      [activeFileId]: {
        ...prev[activeFileId],
        content: newContent
      }
    }));

    triggerToast('Checkbox synchronized');
  };

  const activeFile = activeFileId ? fileSystem[activeFileId] : null;

  const fileStats = useMemo(() => {
    return calculateFileStats(activeFile?.content);
  }, [activeFile?.content]);

  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return Object.values(fileSystem).filter(
      (node) => node.type === 'file' && node.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [fileSystem, searchQuery]);

  const handleToggleReadOnly = () => {
    const next = !isReadOnly;
    setIsReadOnly(next);
    if (next) setEditingBlockIndex(null);
    triggerToast(next ? 'Read-only mode activated' : 'Edit mode restored');
  };

  const handleThemeSettingChange = (theme: ThemeSetting, label: string) => {
    setThemeSetting(theme);
    triggerToast(`Theme set to ${label}`);
  };

  const handleOpenDirectory = async () => {
    const result = await openSystemDirectory();
    if (!result) return;

    setActiveFileId(null);
    setEditingBlockIndex(null);
    setEditValue('');
    setRawTextValue('');
    setFileSystem(result.fileSystem);
    setExpandedFolders({ root: true });
    setSearchQuery('');
    triggerToast(`Opened folder "${result.rootName}"`);
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans selection:bg-indigo-600/30 ${
        isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-850'
      }`}
    >
      <Header
        isDark={isDark}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isReadOnly={isReadOnly}
        activeFile={activeFile}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <div className="flex-1 flex relative overflow-hidden">
        <Sidebar
          isDark={isDark}
          sidebarOpen={sidebarOpen}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          filteredMatches={filteredMatches}
          fileSystem={fileSystem}
          expandedFolders={expandedFolders}
          activeFileId={activeFileId}
          renamingNodeId={renamingNodeId}
          renameValue={renameValue}
          isReadOnly={isReadOnly}
          onOpenDirectory={handleOpenDirectory}
          onToggleFolder={toggleFolder}
          onSelectFile={setActiveFileId}
          onStartRename={handleStartRename}
          onRenameChange={setRenameValue}
          onSaveRename={handleSaveRename}
          onCancelRename={handleCancelRename}
          onAddFile={handleAddFile}
          onAddFolder={handleAddFolder}
          onDeleteNode={handleDeleteNode}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <Editor
          activeFile={activeFile}
          viewMode={viewMode}
          isDark={isDark}
          isReadOnly={isReadOnly}
          fileStats={fileStats}
          rawTextValue={rawTextValue}
          onRawTextChange={handleRawTextChange}
          editingBlockIndex={editingBlockIndex}
          editValue={editValue}
          onStartEditingBlock={startEditingBlock}
          onEditValueChange={setEditValue}
          onCancelEditingBlock={cancelEditingBlock}
          onSaveEditingBlock={saveEditingBlock}
          onToggleCheckbox={toggleCheckbox}
          onCreateFile={() => handleAddFile('root')}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        isReadOnly={isReadOnly}
        onToggleReadOnly={handleToggleReadOnly}
        themeSetting={themeSetting}
        onThemeSettingChange={handleThemeSettingChange}
      />

      <Toast message={toastMessage} isDark={isDark} />
    </div>
  );
}
