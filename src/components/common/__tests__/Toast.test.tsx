import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Toast } from '../Toast';

describe('Toast component', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<Toast message={null} isDark={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders message text in light mode', () => {
    render(<Toast message="File saved successfully" isDark={false} />);
    const toast = screen.getByText('File saved successfully');
    expect(toast).toBeInTheDocument();
    expect(toast.className).toContain('bg-white');
  });

  it('renders with dark styles when isDark is true', () => {
    render(<Toast message="File saved in dark mode" isDark={true} />);
    const toast = screen.getByText('File saved in dark mode');
    expect(toast).toBeInTheDocument();
    expect(toast.className).toContain('bg-slate-950');
  });
});
