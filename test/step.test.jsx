import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import Step from '../src/components/Step.jsx';

describe('Step', () => {
  const step = { label: 'Pour', volume: 10, durationSec: 30 };
  afterEach(() => {
    cleanup();
  });
  it('renders active step without icon', () => {
    render(<Step step={step} idx={0} start="0:00" end="0:30" arrow={10} showWeightTarget isActive />);
    expect(screen.queryByText('☕')).toBeNull();
    expect(screen.getByText('→ 10 g')).toBeInTheDocument();
  });

  it('renders inactive step', () => {
    render(<Step step={step} idx={0} start="0:00" end="0:30" arrow={10} showWeightTarget={false} isActive={false} />);
    expect(screen.getByText('Pour')).toBeInTheDocument();
  });
});
