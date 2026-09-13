import { useState, useEffect } from 'react';
import type { ThemeSetting } from '../types';

export function useTheme(initialTheme: ThemeSetting = 'dark') {
  const [themeSetting, setThemeSetting] = useState<ThemeSetting>(initialTheme);
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const isDark = themeSetting === 'dark' || (themeSetting === 'system' && systemPrefersDark);

  return {
    themeSetting,
    setThemeSetting,
    isDark
  };
}
