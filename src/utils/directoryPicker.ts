import type { FileSystem, FileSystemNode } from '../types';

interface OpenDirectoryResult {
  fileSystem: FileSystem;
  rootName: string;
}

const IGNORED_NAMES = new Set(['.git', 'node_modules', 'dist', 'build', '.next', '.cache', '.gemini']);

/**
 * Traverses a FileSystemDirectoryHandle recursively and builds the FileSystem structure.
 */
async function traverseDirectoryHandle(
  dirHandle: any,
  nodes: FileSystem,
  parentPath = ''
): Promise<string[]> {
  const childrenIds: string[] = [];
  const entries: any[] = [];

  for await (const entry of dirHandle.values()) {
    entries.push(entry);
  }

  // Sort directories first, then alphabetical by name
  entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  for (const entry of entries) {
    const name: string = entry.name;
    if (name.startsWith('.') || IGNORED_NAMES.has(name)) {
      continue;
    }

    const currentPath = parentPath ? `${parentPath}/${name}` : name;
    const nodeId = `node_${currentPath.replace(/[^a-zA-Z0-9_-]/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;

    if (entry.kind === 'directory') {
      const folderNode: FileSystemNode = {
        id: nodeId,
        name: name,
        type: 'folder',
        children: []
      };
      nodes[nodeId] = folderNode;
      const subChildren = await traverseDirectoryHandle(entry, nodes, currentPath);
      folderNode.children = subChildren;
      childrenIds.push(nodeId);
    } else if (entry.kind === 'file') {
      // Only include markdown files
      if (/\.(md|markdown|mdown|mkdn)$/i.test(name)) {
        try {
          const file = await entry.getFile();
          const content = await file.text();
          nodes[nodeId] = {
            id: nodeId,
            name: name,
            type: 'file',
            content: content
          };
          childrenIds.push(nodeId);
        } catch (err) {
          console.warn(`Could not read file ${name}:`, err);
        }
      }
    }
  }

  return childrenIds;
}

/**
 * Fallback parser for FileList from <input type="file" webkitdirectory />
 */
async function parseFileList(files: FileList): Promise<OpenDirectoryResult> {
  const nodes: FileSystem = {};
  const folderPathMap = new Map<string, string>(); // path -> nodeId

  let rootFolderName = 'Workspace';
  if (files.length > 0 && files[0].webkitRelativePath) {
    rootFolderName = files[0].webkitRelativePath.split('/')[0];
  }

  nodes['root'] = {
    id: 'root',
    name: rootFolderName,
    type: 'folder',
    children: []
  };
  folderPathMap.set(rootFolderName, 'root');

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = file.webkitRelativePath || file.name;
    const pathParts = relPath.split('/');

    // Check if any segment is ignored
    const hasIgnored = pathParts.some((part) => part.startsWith('.') || IGNORED_NAMES.has(part));
    if (hasIgnored) continue;

    // Ensure parent folders exist
    let currentParentId = 'root';
    let currentAccumPath = rootFolderName;

    for (let p = 1; p < pathParts.length - 1; p++) {
      const folderName = pathParts[p];
      currentAccumPath += `/${folderName}`;

      if (!folderPathMap.has(currentAccumPath)) {
        const folderId = `folder_${currentAccumPath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        nodes[folderId] = {
          id: folderId,
          name: folderName,
          type: 'folder',
          children: []
        };
        const parentNode = nodes[currentParentId];
        if (parentNode && parentNode.children && !parentNode.children.includes(folderId)) {
          parentNode.children.push(folderId);
        }
        folderPathMap.set(currentAccumPath, folderId);
      }
      currentParentId = folderPathMap.get(currentAccumPath)!;
    }

    const fileName = pathParts[pathParts.length - 1];
    if (/\.(md|markdown|mdown|mkdn)$/i.test(fileName)) {
      const fileId = `file_${relPath.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const content = await file.text();
      nodes[fileId] = {
        id: fileId,
        name: fileName,
        type: 'file',
        content: content
      };
      const parentNode = nodes[currentParentId];
      if (parentNode && parentNode.children && !parentNode.children.includes(fileId)) {
        parentNode.children.push(fileId);
      }
    }
  }

  return {
    fileSystem: nodes,
    rootName: rootFolderName
  };
}

/**
 * Opens system directory picker using File System Access API or input fallback.
 * Returns null if the user cancels the picker.
 */
export async function openSystemDirectory(): Promise<OpenDirectoryResult | null> {
  if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      const nodes: FileSystem = {};
      const rootChildren = await traverseDirectoryHandle(dirHandle, nodes);

      nodes['root'] = {
        id: 'root',
        name: dirHandle.name || 'Workspace',
        type: 'folder',
        children: rootChildren
      };

      return {
        fileSystem: nodes,
        rootName: dirHandle.name || 'Workspace'
      };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User cancelled dialog
        return null;
      }
      console.error('Error selecting directory:', err);
      return null;
    }
  }

  // Fallback for browsers without showDirectoryPicker
  return new Promise<OpenDirectoryResult | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    (input as any).webkitdirectory = true;
    (input as any).directory = true;
    input.multiple = true;
    input.style.display = 'none';

    let resolved = false;

    input.onchange = async () => {
      resolved = true;
      if (input.files && input.files.length > 0) {
        const result = await parseFileList(input.files);
        input.remove();
        resolve(result);
      } else {
        input.remove();
        resolve(null);
      }
    };

    // Listen for cancel event or window focus fallback
    window.addEventListener(
      'focus',
      () => {
        setTimeout(() => {
          if (!resolved) {
            input.remove();
            resolve(null);
          }
        }, 1000);
      },
      { once: true }
    );

    document.body.appendChild(input);
    input.click();
  });
}
