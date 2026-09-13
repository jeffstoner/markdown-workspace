import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkGemoji from 'remark-gemoji';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckIcon } from '../common/Icons';

interface MarkdownBlockProps {
  blockText: string;
  blockIdx: number;
  isDark: boolean;
  isReadOnly: boolean;
  onToggleCheckbox: (blockIdx: number, checkboxIdx: number) => void;
}

export const MarkdownBlock: React.FC<MarkdownBlockProps> = ({
  blockText,
  blockIdx,
  isDark,
  isReadOnly,
  onToggleCheckbox
}) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkGemoji]}
      components={{
        h1: ({ children }) => (
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight my-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2
            className={`text-xl sm:text-2xl font-bold pb-1 border-b my-2 ${
              isDark ? 'text-slate-100 border-slate-800' : 'text-slate-800 border-slate-200'
            }`}
          >
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className={`text-lg sm:text-xl font-semibold my-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className={`text-base sm:text-lg font-semibold my-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className={`text-sm sm:text-base font-medium my-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className={`text-xs sm:text-sm font-medium my-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className={`text-sm sm:text-base leading-relaxed break-words my-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            {children}
          </p>
        ),
        blockquote: ({ children }) => (
          <blockquote
            className={`border-l-4 border-indigo-500 px-4 py-3 italic rounded-r-lg my-3 ${
              isDark ? 'bg-slate-800/30 text-slate-300' : 'bg-indigo-50/70 text-slate-700'
            }`}
          >
            {children}
          </blockquote>
        ),
        ul: ({ node, children, className, ...props }) => {
          const isTaskList = className?.includes('contains-task-list');
          return (
            <ul
              className={`my-2 space-y-1 ${isTaskList ? 'pl-0 list-none' : 'list-disc list-inside pl-1'} ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
              {...props}
            >
              {children}
            </ul>
          );
        },
        ol: ({ node, children, ...props }) => (
          <ol
            className={`my-2 space-y-1 list-decimal list-inside pl-1 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
            {...props}
          >
            {children}
          </ol>
        ),
        li: ({ node, children, className, ...props }) => {
          const isTaskList = className?.includes('task-list-item');
          if (isTaskList) {
            const inputChild = (node?.children as any[])?.find(
              (c) => c.type === 'element' && c.tagName === 'input' && c.properties?.type === 'checkbox'
            );
            const isChecked = Boolean(inputChild?.properties?.checked);
            const lineNum = node?.position?.start?.line;
            const lineIndex = typeof lineNum === 'number' ? lineNum - 1 : undefined;

            const textChildren = React.Children.toArray(children).filter((c) => {
              if (React.isValidElement(c) && ((c.props as any)?.type === 'checkbox' || c.type === 'input')) {
                return false;
              }
              return true;
            });
            if (typeof textChildren[0] === 'string') {
              textChildren[0] = textChildren[0].replace(/^\s+/, '');
              if (textChildren[0] === '') {
                textChildren.shift();
              }
            }

            return (
              <li
                className={`list-none flex items-start gap-2.5 my-1.5 text-sm leading-relaxed ${
                  isChecked
                    ? isDark
                      ? 'line-through text-slate-500'
                      : 'line-through text-slate-400'
                    : isDark
                    ? 'text-slate-200'
                    : 'text-slate-800'
                }`}
                {...props}
              >
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (lineIndex !== undefined) {
                      onToggleCheckbox(blockIdx, lineIndex);
                    }
                  }}
                  className={`mt-0.5 shrink-0 w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                  } ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-500/20'
                      : isDark
                      ? 'border-slate-600 hover:border-indigo-400 bg-slate-900 text-transparent'
                      : 'border-slate-300 hover:border-indigo-500 bg-white text-transparent'
                  }`}
                  title={isReadOnly ? 'Read-only mode active' : isChecked ? 'Mark incomplete' : 'Mark complete'}
                >
                  {isChecked && <CheckIcon className="w-3 h-3 stroke-[3]" />}
                </button>
                <span
                  className={`flex-1 select-text ${!isReadOnly ? 'cursor-pointer' : ''}`}
                  onClick={(e) => {
                    if (isReadOnly || lineIndex === undefined) return;
                    const selection = window.getSelection();
                    if (selection && selection.toString().length > 0) return;
                    e.stopPropagation();
                    onToggleCheckbox(blockIdx, lineIndex);
                  }}
                >
                  {textChildren}
                </span>
              </li>
            );
          }

          return (
            <li
              className={`my-1 ${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm leading-relaxed`}
              {...props}
            >
              {children}
            </li>
          );
        },
        input: () => null,
        table: ({ children }) => (
          <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table
              className={`min-w-full divide-y text-xs sm:text-sm text-left ${
                isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-800'
              }`}
            >
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead
            className={
              isDark
                ? 'bg-slate-950/80 text-slate-300 font-semibold uppercase tracking-wider text-[11px]'
                : 'bg-slate-100/80 text-slate-700 font-semibold uppercase tracking-wider text-[11px]'
            }
          >
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody className={`divide-y ${isDark ? 'divide-slate-800/60 bg-slate-900/40' : 'divide-slate-200/80 bg-white'}`}>
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className={`transition-colors ${isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}`}>
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 font-bold border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2.5 whitespace-normal border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0">
            {children}
          </td>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${
              isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'
            } underline underline-offset-2`}
          >
            {children}
          </a>
        ),
        pre: ({ children }) => <div className="my-3 overflow-hidden rounded-xl">{children}</div>,
        code: ({ node, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match || String(children).includes('\n')) {
            return (
              <SyntaxHighlighter
                style={isDark ? oneDark : oneLight}
                language={match ? match[1] : 'text'}
                PreTag="div"
                customStyle={{
                  margin: 0,
                  borderRadius: '0.75rem',
                  fontSize: '0.8rem',
                  padding: '1rem',
                  border: isDark ? '1px solid #1e293b' : '1px solid #e2e8f0'
                }}
              >
                {codeString}
              </SyntaxHighlighter>
            );
          }

          return (
            <code
              className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium border ${
                isDark
                  ? 'bg-slate-800 text-pink-400 border-slate-700'
                  : 'bg-slate-100 text-pink-600 border-slate-200'
              }`}
              {...props}
            >
              {children}
            </code>
          );
        }
      }}
    >
      {blockText}
    </ReactMarkdown>
  );
};
