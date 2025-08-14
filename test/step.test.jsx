import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import Step from '../src/components/Step.jsx';

describe('Step', () => {
  const step = { label: 'Pour', volume: 10, durationSec: 30 };
  afterEach(() => {
    cleanup();
  });
  it('shows coffee when active', () => {
    render(<Step step={step} idx={0} start="0:00" end="0:30" arrow={10} showWeightTarget isActive />);
    expect(screen.getByText('☕')).toBeInTheDocument();
  });

  it('hides coffee when inactive', () => {
    render(<Step step={step} idx={0} start="0:00" end="0:30" arrow={10} showWeightTarget={false} isActive={false} />);
    expect(screen.queryByText('☕')).toBeNull();
  });
});
