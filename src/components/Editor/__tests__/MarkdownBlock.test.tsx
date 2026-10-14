import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MarkdownBlock } from '../MarkdownBlock';

describe('MarkdownBlock component', () => {
  describe('react-syntax-highlighter upgrade verification', () => {
    it('highlights JavaScript code blocks with SyntaxHighlighter', () => {
      const code = '```javascript\nconst greeting = "hello world";\nconsole.log(greeting);\n```';
      const { container } = render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      // Verifies code block container is rendered with syntax highlighting
      expect(screen.getByText(/hello world/i)).toBeInTheDocument();
      expect(screen.getByText(/console/i)).toBeInTheDocument();
      const codeWrapper = container.querySelector('.my-3.overflow-hidden');
      expect(codeWrapper).not.toBeNull();
      const syntaxContainer = codeWrapper?.querySelector('div[style]');
      expect(syntaxContainer).not.toBeNull();
    });

    it('highlights Python code blocks', () => {
      const code = '```python\ndef greet(name):\n    print(f"Hello, {name}")\n```';
      render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={true}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByText(/def/i)).toBeInTheDocument();
      expect(screen.getByText(/greet/i)).toBeInTheDocument();
    });

    it('highlights Rust code blocks', () => {
      const code = '```rust\nfn main() {\n    println!("Hello Rust!");\n}\n```';
      render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByText(/fn/i)).toBeInTheDocument();
      expect(screen.getByText(/Hello Rust!/i)).toBeInTheDocument();
    });

    it('highlights HTML code blocks', () => {
      const code = '```html\n<div class="test">Sample</div>\n```';
      render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={true}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByText(/Sample/i)).toBeInTheDocument();
    });

    it('renders plain text code blocks when no language is specified', () => {
      const code = '```\nplain unformatted text line 1\nplain line 2\n```';
      render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByText(/plain unformatted text line 1/i)).toBeInTheDocument();
    });

    it('renders inline code with custom badge styling instead of full SyntaxHighlighter', () => {
      const md = 'Here is `inlineVariable` in text.';
      const { container } = render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      const inlineCode = container.querySelector('code');
      expect(inlineCode).not.toBeNull();
      expect(inlineCode?.textContent).toBe('inlineVariable');
      expect(inlineCode?.className).toContain('font-mono');
      expect(inlineCode?.className).toContain('text-pink-600');
    });

    it('applies dark theme styling when isDark is true', () => {
      const code = '```js\nconst darkThemeTest = true;\n```';
      const { container } = render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={true}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      const syntaxContainer = container.querySelector('.my-3 div[style]');
      expect(syntaxContainer).not.toBeNull();
      const style = syntaxContainer?.getAttribute('style') || '';
      expect(style).toContain('background');
      // Dark border: 1px solid #1e293b (rgb(30, 41, 59))
      expect(style).toMatch(/(#1e293b|rgb\(30,\s*41,\s*59\))/);
    });

    it('applies light theme styling when isDark is false', () => {
      const code = '```js\nconst lightThemeTest = true;\n```';
      const { container } = render(
        <MarkdownBlock
          blockText={code}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      const syntaxContainer = container.querySelector('.my-3 div[style]');
      expect(syntaxContainer).not.toBeNull();
      const style = syntaxContainer?.getAttribute('style') || '';
      expect(style).toContain('background');
      // Light border: 1px solid #e2e8f0 (rgb(226, 232, 240))
      expect(style).toMatch(/(#e2e8f0|rgb\(226,\s*232,\s*240\))/);
    });
  });

  describe('markdown features & interactive elements', () => {
    it('renders headings with correct styling', () => {
      const md = '# Title 1\n## Title 2\n### Title 3';
      render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Title 1');
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Title 2');
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Title 3');
    });

    it('renders blockquotes', () => {
      const md = '> Important notice here';
      const { container } = render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      const bq = container.querySelector('blockquote');
      expect(bq).not.toBeNull();
      expect(bq?.textContent).toContain('Important notice here');
    });

    it('renders task list items with interactive checkboxes', () => {
      const md = '- [ ] First task\n- [x] Second task';
      const onToggle = vi.fn();

      render(
        <MarkdownBlock
          blockText={md}
          blockIdx={2}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={onToggle}
        />
      );

      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(2);

      // Click on the first checkbox
      fireEvent.click(buttons[0]);
      expect(onToggle).toHaveBeenCalledTimes(1);
      expect(onToggle).toHaveBeenCalledWith(2, expect.any(Number));
    });

    it('disables checkbox buttons in read-only mode', () => {
      const md = '- [ ] Read-only task';
      const onToggle = vi.fn();

      render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={true}
          onToggleCheckbox={onToggle}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      fireEvent.click(button);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it('renders tables with header and body cells', () => {
      const md = '| Name | Age |\n| --- | --- |\n| Alice | 30 |\n| Bob | 25 |';
      render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('renders links with secure attributes', () => {
      const md = '[External Link](https://example.com)';
      render(
        <MarkdownBlock
          blockText={md}
          blockIdx={0}
          isDark={false}
          isReadOnly={false}
          onToggleCheckbox={vi.fn()}
        />
      );

      const link = screen.getByRole('link', { name: 'External Link' });
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });
});
