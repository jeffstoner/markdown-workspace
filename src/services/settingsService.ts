import { invoke, isTauri } from '@tauri-apps/api/core';
import type { AppSettings, ThemeSetting } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const STORAGE_KEY = 'markdown_workspace_settings';

/**
 * Loads settings from the native Tauri backend (~/.markdown-workspace.json)
 * with a fallback for browser-based development.
 */
export async function fetchSettings(): Promise<AppSettings> {
  if (isTauri()) {
    try {
      return await invoke<AppSettings>('get_settings');
    } catch (err) {
      console.error('Failed to invoke get_settings in Tauri:', err);
      return DEFAULT_SETTINGS;
    }
  }

  // Fallback for standalone browser preview / testing
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const readOnly =
        typeof parsed['read-only'] === 'boolean'
          ? parsed['read-only']
          : DEFAULT_SETTINGS['read-only'];
      const appTheme = ['system', 'light', 'dark'].includes(parsed['app-theme'])
        ? (parsed['app-theme'] as ThemeSetting)
        : DEFAULT_SETTINGS['app-theme'];
      return { 'read-only': readOnly, 'app-theme': appTheme };
    }
  } catch (err) {
    console.warn('Failed to read from localStorage fallback:', err);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Saves settings to the native Tauri backend (~/.markdown-workspace.json)
 * with a fallback for browser-based development.
 */
export async function saveSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
  const current = await fetchSettings();
  const nextSettings: AppSettings = {
    'read-only':
      typeof updates['read-only'] === 'boolean'
        ? updates['read-only']
        : current['read-only'],
    'app-theme':
      updates['app-theme'] && ['system', 'light', 'dark'].includes(updates['app-theme'])
        ? updates['app-theme']
        : current['app-theme']
  };

  if (isTauri()) {
    try {
      return await invoke<AppSettings>('save_settings', { settings: nextSettings });
    } catch (err) {
      console.error('Failed to invoke save_settings in Tauri:', err);
      throw err;
    }
  }

  // Fallback for standalone browser preview / testing
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSettings, null, 2));
  } catch (err) {
    console.warn('Failed to save to localStorage fallback:', err);
  }
  return nextSettings;
}
