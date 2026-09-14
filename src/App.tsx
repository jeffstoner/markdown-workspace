import React, { useState, useEffect, useMemo } from 'react';
import type { FileSystem, FileSystemNode, ViewMode, ThemeSetting } from './types';
import { initialFileSystem } from './data/initialFileSystem';
import { calculateFileStats } from './utils/markdown';
import { useTheme } from './hooks/useTheme';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Editor } from './components/Editor/Editor';
import { SettingsModal } from './components/Settings/SettingsModal';
import { Toast } from './components/common/Toast';
import { fetchSettings, saveSettings } from './services/settingsService';
import {
  openWorkspaceDirectory,
  scanDirectory,
  getCliTarget,
  getAppVersion,
  readFileContent,
  writeFileContent,
  createFileEntry,
  createFolderEntry,
  renameEntry,
  deleteEntry
} from './services/fileSystemService';

function getAncestorFolderIds(fsMap: FileSystem, targetId: string): string[] {
  const ancestors: string[] = ['root'];
  for (const [folderId, node] of Object.entries(fsMap)) {
    if (node.type === 'folder' && node.children && node.children.includes(targetId)) {
      ancestors.push(folderId);
      ancestors.push(...getAncestorFolderIds(fsMap, folderId));
    }
  }
  return ancestors;
}

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
  const [appVersion, setAppVersion] = useState<string>('v1.0.1');

  const { themeSetting, setThemeSetting, isDark } = useTheme('system');

  useEffect(() => {
    async function loadInitialSettings() {
      try {
        const settings = await fetchSettings();
        setIsReadOnly(settings['read-only']);
        setThemeSetting(settings['app-theme']);
      } catch (err) {
        console.error('Failed to load initial settings:', err);
      }

      try {
        const version = await getAppVersion();
        setAppVersion(version);
      } catch (err) {
        console.warn('Failed to load app version:', err);
      }

      try {
        const cliTarget = await getCliTarget();
        if (cliTarget) {
          const scanResult = await scanDirectory(cliTarget.directory_path);
          if (scanResult) {
            setFileSystem(scanResult.fileSystem);

            if (cliTarget.file_path) {
              const targetNode = Object.values(scanResult.fileSystem).find(
                (n) => n.path && (n.path === cliTarget.file_path || n.path.endsWith(cliTarget.file_path!))
              );

              if (targetNode) {
                const ancestors = getAncestorFolderIds(scanResult.fileSystem, targetNode.id);
                const expanded: Record<string, boolean> = {};
                ancestors.forEach((id) => {
                  expanded[id] = true;
                });
                setExpandedFolders(expanded);
                setActiveFileId(targetNode.id);

                if (targetNode.content !== undefined) {
                  setRawTextValue(targetNode.content);
                  setEditingBlockIndex(null);
                } else if (targetNode.path) {
                  const content = await readFileContent(targetNode.path);
                  setFileSystem((prev) => ({
                    ...prev,
                    [targetNode.id]: {
                      ...prev[targetNode.id],
                      content
                    }
                  }));
                  setRawTextValue(content);
                  setEditingBlockIndex(null);
                }
              }
            } else {
              // Directory argument: set worktree root with no open file
              setActiveFileId(null);
              setRawTextValue('');
              setExpandedFolders({ root: true });
            }
          }
        }
      } catch (err) {
        console.error('Failed to process CLI target parameter:', err);
      }
    }
    loadInitialSettings();
  }, [setThemeSetting]);

  // Load content when active file changes (lazy load from disk if needed)
  useEffect(() => {
    if (!activeFileId || !fileSystem[activeFileId]) return;

    const file = fileSystem[activeFileId];
    if (file.content !== undefined) {
      setRawTextValue(file.content || '');
      setEditingBlockIndex(null);
    } else if (file.path) {
      readFileContent(file.path)
        .then((content) => {
          setFileSystem((prev) => ({
            ...prev,
            [activeFileId]: {
              ...prev[activeFileId],
              content
            }
          }));
          setRawTextValue(content);
          setEditingBlockIndex(null);
        })
        .catch((err) => {
          console.error('Failed to read file from disk:', err);
          triggerToast('Failed to load file content');
        });
    }
  }, [activeFileId]);

  // Debounced auto-save for raw source editor modifications
  useEffect(() => {
    if (!activeFileId || isReadOnly) return;
    const file = fileSystem[activeFileId];
    if (!file || !file.path || file.content === undefined) return;

    const timeout = setTimeout(() => {
      if (file.path && file.content !== undefined) {
        writeFileContent(file.path, file.content).catch((err) => {
          console.error('Failed to auto-save file:', err);
        });
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [rawTextValue, activeFileId, isReadOnly, fileSystem]);

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

  const handleAddFile = async (parentFolderId: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    const parent = fileSystem[parentFolderId];
    if (!parent) return;

    const newId = `file_${Date.now()}`;
    const defaultName = 'New Document.md';
    const defaultContent = '# New Document\n\nHover here and click the pencil to edit this block!';

    let createdPath: string | undefined;

    if (parent.path) {
      try {
        const created = await createFileEntry(parent.path, defaultName, defaultContent);
        if (created) {
          createdPath = created.path;
        }
      } catch (err) {
        console.error('Failed to create file on disk:', err);
        triggerToast('Failed to create file on disk');
        return;
      }
    }

    const newFile: FileSystemNode = {
      id: newId,
      name: defaultName,
      type: 'file',
      path: createdPath,
      content: defaultContent
    };

    setFileSystem((prev) => {
      const p = prev[parentFolderId];
      if (!p) return prev;
      return {
        ...prev,
        [newId]: newFile,
        [parentFolderId]: {
          ...p,
          children: [...(p.children || []), newId]
        }
      };
    });

    setActiveFileId(newId);
    setExpandedFolders((prev) => ({ ...prev, [parentFolderId]: true }));
    triggerToast('New Markdown file created');
  };

  const handleAddFolder = async (parentFolderId: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    const parent = fileSystem[parentFolderId];
    if (!parent) return;

    const newId = `folder_${Date.now()}`;
    const defaultName = 'New Folder';

    let createdPath: string | undefined;

    if (parent.path) {
      try {
        const created = await createFolderEntry(parent.path, defaultName);
        if (created) {
          createdPath = created.path;
        }
      } catch (err) {
        console.error('Failed to create folder on disk:', err);
        triggerToast('Failed to create folder on disk');
        return;
      }
    }

    const newFolder: FileSystemNode = {
      id: newId,
      name: defaultName,
      type: 'folder',
      path: createdPath,
      children: []
    };

    setFileSystem((prev) => {
      const p = prev[parentFolderId];
      if (!p) return prev;
      return {
        ...prev,
        [newId]: newFolder,
        [parentFolderId]: {
          ...p,
          children: [...(p.children || []), newId]
        }
      };
    });

    setExpandedFolders((prev) => ({ ...prev, [parentFolderId]: true, [newId]: true }));
    triggerToast('New folder created');
  };

  const handleDeleteNode = async (idToDelete: string) => {
    if (isReadOnly) {
      triggerToast('Read-only mode active');
      return;
    }
    if (idToDelete === 'root') return;

    const targetNode = fileSystem[idToDelete];
    if (targetNode?.path) {
      try {
        await deleteEntry(targetNode.path);
      } catch (err) {
        console.error('Failed to delete on disk:', err);
        triggerToast('Failed to delete from disk');
        return;
      }
    }

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

  const handleSaveRename = async (nodeId: string) => {
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

    const node = fileSystem[nodeId];
    let newPath = node?.path;

    if (node?.path) {
      try {
        const renamed = await renameEntry(node.path, finalName);
        if (renamed) {
          newPath = renamed.path;
        }
      } catch (err) {
        console.error('Failed to rename on disk:', err);
        triggerToast('Failed to rename on disk');
        setRenamingNodeId(null);
        return;
      }
    }

    setFileSystem((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        name: finalName,
        path: newPath
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

    setRawTextValue(newContent);
    setEditingBlockIndex(null);
    setEditValue('');

    if (file.path) {
      writeFileContent(file.path, newContent).catch((err) => {
        console.error('Failed to save block to disk:', err);
        triggerToast('Failed to save to disk');
      });
    }

    triggerToast('Block updated and saved');
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
    setRawTextValue(newContent);

    if (file.path) {
      writeFileContent(file.path, newContent).catch((err) => {
        console.error('Failed to save checkbox to disk:', err);
        triggerToast('Failed to save to disk');
      });
    }

    triggerToast('Checkbox synchronized & saved');
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
    saveSettings({ 'read-only': next }).catch((err) => {
      console.error('Failed to save read-only setting:', err);
    });
  };

  const handleThemeSettingChange = (theme: ThemeSetting, label: string) => {
    setThemeSetting(theme);
    triggerToast(`Theme set to ${label}`);
    saveSettings({ 'app-theme': theme }).catch((err) => {
      console.error('Failed to save theme setting:', err);
    });
  };

  const handleOpenDirectory = async () => {
    try {
      const result = await openWorkspaceDirectory();
      if (!result) return;

      setActiveFileId(null);
      setEditingBlockIndex(null);
      setEditValue('');
      setRawTextValue('');
      setFileSystem(result.fileSystem);
      setExpandedFolders({ root: true });
      setSearchQuery('');
      triggerToast(`Opened folder "${result.rootName}"`);
    } catch (err) {
      console.error('Failed to open directory:', err);
      triggerToast('Could not open directory');
    }
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
        version={appVersion}
      />

      <div className="flex-1 flex overflow-hidden">
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
