import React from 'react';
import { CheckIcon } from './Icons';

interface ToastProps {
  message: string | null;
  isDark: boolean;
}

export const Toast: React.FC<ToastProps> = ({ message, isDark }) => {
  if (!message) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 border px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl flex items-center gap-2 z-50 animate-fade-in ${
        isDark
          ? 'bg-slate-950 border-indigo-500/40 text-indigo-300'
          : 'bg-white border-indigo-200 text-indigo-600 shadow-slate-300'
      }`}
    >
      <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
      {message}
    </div>
  );
};
