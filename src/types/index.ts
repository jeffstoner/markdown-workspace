export interface FileSystemNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: string[];
}

export type FileSystem = Record<string, FileSystemNode>;

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
