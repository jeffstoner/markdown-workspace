import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EditorStats } from '../EditorStats';
import type { FileStats } from '../../../types';

describe('EditorStats component', () => {
  it('renders nothing when stats is null', () => {
    const { container } = render(<EditorStats stats={null} isDark={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders line, word, and character counts', () => {
    const stats: FileStats = {
      lines: 25,
      words: 150,
      chars: 980,
      totalChecks: 0,
      completedChecks: 0,
      completionRate: null,
    };

    render(<EditorStats stats={stats} isDark={false} />);
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('lines')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('words')).toBeInTheDocument();
    expect(screen.getByText('980')).toBeInTheDocument();
    expect(screen.getByText('characters')).toBeInTheDocument();
  });

  it('renders checklist badge when totalChecks > 0', () => {
    const stats: FileStats = {
      lines: 10,
      words: 40,
      chars: 200,
      totalChecks: 5,
      completedChecks: 3,
      completionRate: 60,
    };

    render(<EditorStats stats={stats} isDark={true} />);
    expect(screen.getByText(/Checklist: 3 \/ 5 completed/i)).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });
});
