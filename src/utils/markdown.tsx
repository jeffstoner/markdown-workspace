import React from 'react';
import type { FileStats } from '../types';

interface InlinePart {
  text: string;
  isRaw: boolean;
  type?: string | null;
  url?: string;
}

export const parseInlineMarkdown = (text: string, isDark: boolean): React.ReactNode => {
  if (!text) return null;
  let parts: InlinePart[] = [{ text, isRaw: true }];

  // Code spans
  parts = parts.flatMap<InlinePart>((p) => {
    if (!p.isRaw) return [p];
    const subparts = p.text.split(/`([^`]+)`/g);
    return subparts.map((str, idx) => ({
      text: str,
      isRaw: idx % 2 === 0,
      type: idx % 2 === 1 ? 'code' : null
    }));
  });

  // Bold text
  parts = parts.flatMap<InlinePart>((p) => {
    if (!p.isRaw) return [p];
    const subparts = p.text.split(/\*\*([^*]+)\*\*/g);
    return subparts.map((str, idx) => ({
      text: str,
      isRaw: idx % 2 === 0,
      type: idx % 2 === 1 ? 'bold' : p.type
    }));
  });

  // Italic text
  parts = parts.flatMap<InlinePart>((p) => {
    if (!p.isRaw || p.type === 'bold') return [p];
    const subparts = p.text.split(/\*([^*]+)\*/g);
    return subparts.map((str, idx) => ({
      text: str,
      isRaw: idx % 2 === 0,
      type: idx % 2 === 1 ? 'italic' : p.type
    }));
  });

  // Links
  parts = parts.flatMap<InlinePart>((p) => {
    if (!p.isRaw || p.type) return [p];
    const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const result: InlinePart[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(p.text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: p.text.substring(lastIndex, match.index), isRaw: true });
      }
      result.push({
        text: match[1],
        isRaw: false,
        type: 'link',
        url: match[2]
      });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < p.text.length) {
      result.push({ text: p.text.substring(lastIndex), isRaw: true });
    }
    return result.length > 0 ? result : [p];
  });

  return parts.map((p, i) => {
    if (p.type === 'code') {
      return (
        <code
          key={i}
          className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${
            isDark
              ? 'bg-slate-800 text-pink-400 border-slate-700'
              : 'bg-slate-100 text-pink-600 border-slate-200'
          }`}
        >
          {p.text}
        </code>
      );
    }
    if (p.type === 'bold') {
      return <strong key={i} className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.text}</strong>;
    }
    if (p.type === 'italic') {
      return <em key={i} className={`italic ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{p.text}</em>;
    }
    if (p.type === 'link') {
      return (
        <a
          key={i}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'} underline underline-offset-2`}
        >
          {p.text}
        </a>
      );
    }
    return p.text;
  });
};

export const calculateFileStats = (content?: string): FileStats | null => {
  if (!content) return null;
  const lines = content.split('\n').length;
  const words = content.trim() === '' ? 0 : content.trim().split(/\s+/).length;
  const chars = content.length;
  const totalChecks = (content.match(/^[-\*\+]\s+\[([ xX])\]/gm) || []).length;
  const completedChecks = (content.match(/^[-\*\+]\s+\[([xX])\]/gm) || []).length;
  const completionRate = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : null;
  return { lines, words, chars, totalChecks, completedChecks, completionRate };
};
