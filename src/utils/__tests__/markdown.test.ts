import { describe, it, expect } from 'vitest';
import { calculateFileStats, parseInlineMarkdown } from '../markdown';
import React from 'react';
import { render } from '@testing-library/react';

describe('markdown utils', () => {
  describe('calculateFileStats', () => {
    it('returns null when content is empty or undefined', () => {
      expect(calculateFileStats(undefined)).toBeNull();
      expect(calculateFileStats('')).toBeNull();
    });

    it('calculates lines, words, and characters accurately', () => {
      const content = 'Hello world\nSecond line here\nThird line';
      const stats = calculateFileStats(content);

      expect(stats).not.toBeNull();
      expect(stats?.lines).toBe(3);
      expect(stats?.words).toBe(7);
      expect(stats?.chars).toBe(content.length);
      expect(stats?.totalChecks).toBe(0);
      expect(stats?.completedChecks).toBe(0);
      expect(stats?.completionRate).toBeNull();
    });

    it('calculates checklist completion rates correctly', () => {
      const content = `
# Tasks
- [x] Task 1
- [ ] Task 2
* [X] Task 3
+ [ ] Task 4
`;
      const stats = calculateFileStats(content);

      expect(stats).not.toBeNull();
      expect(stats?.totalChecks).toBe(4);
      expect(stats?.completedChecks).toBe(2);
      expect(stats?.completionRate).toBe(50);
    });

    it('handles 100% and 0% completion rates', () => {
      const allDone = '- [x] Done\n* [x] Also done';
      expect(calculateFileStats(allDone)?.completionRate).toBe(100);

      const noneDone = '- [ ] Not done\n+ [ ] Still not done';
      expect(calculateFileStats(noneDone)?.completionRate).toBe(0);
    });
  });

  describe('parseInlineMarkdown', () => {
    it('returns null for empty text', () => {
      expect(parseInlineMarkdown('', false)).toBeNull();
    });

    it('parses code spans into code elements', () => {
      const result = parseInlineMarkdown('Here is `myFunction()` code', false);
      const { container } = render(React.createElement('span', null, result));
      const codeEl = container.querySelector('code');

      expect(codeEl).not.toBeNull();
      expect(codeEl?.textContent).toBe('myFunction()');
    });

    it('parses bold and italic markdown', () => {
      const result = parseInlineMarkdown('This is **bold** and *italic* text', false);
      const { container } = render(React.createElement('span', null, result));

      const boldEl = container.querySelector('strong');
      expect(boldEl).not.toBeNull();
      expect(boldEl?.textContent).toBe('bold');

      const italicEl = container.querySelector('em');
      expect(italicEl).not.toBeNull();
      expect(italicEl?.textContent).toBe('italic');
    });

    it('parses markdown links', () => {
      const result = parseInlineMarkdown('Check [Google](https://google.com)', false);
      const { container } = render(React.createElement('span', null, result));

      const linkEl = container.querySelector('a');
      expect(linkEl).not.toBeNull();
      expect(linkEl?.textContent).toBe('Google');
      expect(linkEl?.getAttribute('href')).toBe('https://google.com');
      expect(linkEl?.getAttribute('target')).toBe('_blank');
      expect(linkEl?.getAttribute('rel')).toBe('noopener noreferrer');
    });

    it('applies dark mode classes when isDark is true', () => {
      const result = parseInlineMarkdown('`code` and [link](https://test.com)', true);
      const { container } = render(React.createElement('span', null, result));

      const codeEl = container.querySelector('code');
      expect(codeEl?.className).toContain('bg-slate-800');

      const linkEl = container.querySelector('a');
      expect(linkEl?.className).toContain('text-indigo-400');
    });
  });
});
