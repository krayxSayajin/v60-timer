import React from 'react';

export default function Step({ step, idx, start, end, arrow, showWeightTarget, isActive }) {
  return (
    <div
      id={`step-${idx}`}
      className={[
        'relative rounded-xl border p-3 transition-colors',
        isActive
          ? 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] shadow-[0_0_0_1px_rgba(37,99,235,0.25)]'
          : 'bg-neutral-800/60 border-neutral-700'
      ].join(' ')}
      aria-current={isActive ? 'step' : undefined}
    >
      <div className="flex items-center justify-between">
        <div
          className={[
            'font-medium',
            isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-light-text)]'
          ].join(' ')}
        >
          {step.label}
        </div>
        <div
          className={[
            'text-sm',
            isActive ? 'text-[var(--color-muted)]' : 'text-[var(--color-light-muted)]'
          ].join(' ')}
        >
          {step.volume} g • {step.durationSec}s
        </div>
      </div>
      <div
        className={[
          'mt-1 flex items-center justify-between text-xs',
          isActive ? 'text-[var(--color-muted)]' : 'text-[var(--color-light-muted)]'
        ].join(' ')}
      >
        <div>start {start}</div>
        <div>end {end}</div>
      </div>
      {showWeightTarget && (
        <div className="mt-1 text-[var(--color-accent)] text-xs">→ {arrow} g</div>
      )}
    </div>
  );
}
