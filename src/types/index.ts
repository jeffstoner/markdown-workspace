export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: string[];
  path?: string;
}

export type FileSystem = Record<string, FileSystemNode>;

export interface WorkspaceScanResult {
  root_name: string;
  root_path: string;
  file_system: FileSystem;
}

export interface CliTarget {
  directory_path: string;
  file_path?: string | null;
}

export type ThemeSetting = 'light' | 'dark' | 'system';

export type ViewMode = 'visual' | 'source';

export interface FileStats {
  lines: number;
  words: number;
  chars: number;
  totalChecks: number;
  completedChecks: number;
  completionRate: number | null;
}

export interface AppSettings {
  'read-only': boolean;
  'app-theme': ThemeSetting;
}

export const DEFAULT_SETTINGS: AppSettings = {
  'read-only': false,
  'app-theme': 'system'
};

