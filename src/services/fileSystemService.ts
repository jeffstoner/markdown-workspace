import { invoke, isTauri } from '@tauri-apps/api/core';
import type { FileSystem, FileSystemNode, WorkspaceScanResult, CliTarget } from '../types';
import { openSystemDirectory } from '../utils/directoryPicker';

export interface OpenWorkspaceResult {
  fileSystem: FileSystem;
  rootName: string;
  rootPath?: string;
}

/**
 * Scans a workspace directory directly by path without opening a picker dialog.
 */
export async function scanDirectory(directoryPath: string): Promise<OpenWorkspaceResult | null> {
  if (isTauri()) {
    try {
      const scanResult = await invoke<WorkspaceScanResult>('scan_workspace_directory', {
        directoryPath
      });

      return {
        fileSystem: scanResult.file_system,
        rootName: scanResult.root_name,
        rootPath: scanResult.root_path
      };
    } catch (err) {
      console.error('Failed to scan workspace directory:', err);
      throw err;
    }
  }
  return null;
}

/**
 * Retrieves the CLI target argument (if any was passed on application startup).
 */
export async function getCliTarget(): Promise<CliTarget | null> {
  if (isTauri()) {
    try {
      return await invoke<CliTarget | null>('get_cli_target');
    } catch (err) {
      console.error('Failed to get CLI target:', err);
      return null;
    }
  }
  return null;
}

/**
 * Gets the application version formatted as vX.Y.Z.
 */
export async function getAppVersion(): Promise<string> {
  if (isTauri()) {
    try {
      return await invoke<string>('get_app_version');
    } catch (err) {
      console.warn('Failed to get app version via Tauri command:', err);
    }
  }
  return 'v1.0.2';
}

/**
 * Opens a workspace directory using native OS dialog in Tauri,
 * or falls back to the browser's directory picker.
 */
export async function openWorkspaceDirectory(): Promise<OpenWorkspaceResult | null> {
  if (isTauri()) {
    try {
      const selectedPath = await invoke<string | null>('open_directory_dialog');
      if (!selectedPath) {
        // User cancelled selection dialog
        return null;
      }

      const scanResult = await invoke<WorkspaceScanResult>('scan_workspace_directory', {
        directoryPath: selectedPath
      });

      return {
        fileSystem: scanResult.file_system,
        rootName: scanResult.root_name,
        rootPath: scanResult.root_path
      };
    } catch (err) {
      console.error('Failed to open native workspace directory:', err);
      throw err;
    }
  }

  // Browser fallback
  return openSystemDirectory();
}

/**
 * Reads the UTF-8 content of a file from disk.
 */
export async function readFileContent(filePath: string): Promise<string> {
  if (isTauri()) {
    return await invoke<string>('read_file_content', { filePath });
  }
  return '';
}

/**
 * Writes UTF-8 content to a file on disk.
 */
export async function writeFileContent(filePath: string, content: string): Promise<void> {
  if (isTauri()) {
    await invoke<void>('write_file_content', { filePath, content });
  }
}

/**
 * Creates a new Markdown file on disk.
 */
export async function createFileEntry(
  parentPath: string,
  name: string,
  initialContent?: string
): Promise<FileSystemNode | null> {
  if (isTauri()) {
    return await invoke<FileSystemNode>('create_file_entry', {
      parentPath,
      name,
      initialContent
    });
  }
  return null;
}

/**
 * Creates a new directory on disk.
 */
export async function createFolderEntry(
  parentPath: string,
  name: string
): Promise<FileSystemNode | null> {
  if (isTauri()) {
    return await invoke<FileSystemNode>('create_folder_entry', {
      parentPath,
      name
    });
  }
  return null;
}

/**
 * Renames a file or directory on disk.
 */
export async function renameEntry(
  oldPath: string,
  newName: string
): Promise<FileSystemNode | null> {
  if (isTauri()) {
    return await invoke<FileSystemNode>('rename_entry', {
      oldPath,
      newName
    });
  }
  return null;
}

/**
 * Deletes a file or directory on disk.
 */
export async function deleteEntry(path: string): Promise<void> {
  if (isTauri()) {
    await invoke<void>('delete_entry', { path });
  }
}
