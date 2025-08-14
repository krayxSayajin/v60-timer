import React from 'react';

export default function Step({ step, idx, start, end, arrow, showWeightTarget, isActive }) {
  return (
    <div
      id={`step-${idx}`}
      className={[
        'relative rounded-xl border p-3 transition-colors',
        isActive
          ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]'
          : 'bg-neutral-800/60 border-neutral-700'
      ].join(' ')}
      aria-current={isActive ? 'step' : undefined}
    >
      {isActive && (
        <span
          className="coffee-steam absolute right-3 top-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          ☕
        </span>
      )}
      <div className="flex items-center justify-between">
        <div className="font-medium">{step.label}</div>
        <div className="text-stone-300 text-sm">{step.volume} g • {step.durationSec}s</div>
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-stone-400">
        <div>start {start}</div>
        <div>end {end}</div>
      </div>
      {showWeightTarget && (
        <div className="mt-1 text-emerald-400 text-xs">→ {arrow} g</div>
      )}
    </div>
  );
}
