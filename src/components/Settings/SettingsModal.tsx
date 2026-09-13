import React from 'react';
import type { ThemeSetting } from '../../types';
import {
  SettingsIcon,
  CloseIcon,
  LockIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon
} from '../common/Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  isReadOnly: boolean;
  onToggleReadOnly: () => void;
  themeSetting: ThemeSetting;
  onThemeSettingChange: (theme: ThemeSetting, label: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  isReadOnly,
  onToggleReadOnly,
  themeSetting,
  onThemeSettingChange
}) => {
  if (!isOpen) return null;

  const themes: { id: ThemeSetting; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'light', label: 'Light', icon: SunIcon },
    { id: 'dark', label: 'Dark', icon: MoonIcon },
    { id: 'system', label: 'System', icon: MonitorIcon }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Preferences & Settings</h3>
              <p className="text-xs text-slate-400">Configure editing & appearance options</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'hover:bg-slate-800 text-slate-400 hover:text-white'
                : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="py-5 space-y-6">
          {/* Setting 1: Read-Only Mode */}
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <LockIcon className="w-4 h-4 text-indigo-500" />
                <span>Read-only mode</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevent editing files, updating paragraphs, and toggling task checkboxes.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={isReadOnly}
              onClick={onToggleReadOnly}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                isReadOnly ? 'bg-indigo-600' : isDark ? 'bg-slate-800' : 'bg-slate-300'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isReadOnly ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Setting 2: Display Theme */}
          <div className="space-y-2.5">
            <div>
              <label className="font-semibold text-sm block">Display Theme</label>
              <p className="text-xs text-slate-400">Choose your color scheme or follow the operating system</p>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1">
              {themes.map((theme) => {
                const IconComponent = theme.icon;
                const isSelected = themeSetting === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onThemeSettingChange(theme.id, theme.label)}
                    className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-500 shadow-sm'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`pt-4 border-t flex justify-end ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
