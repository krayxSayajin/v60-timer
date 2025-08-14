import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Step from './Step';

export default function Brew({ recipe, onBack }) {
  const DEFAULT_RATIO = 15;
  const [coffeeG, setCoffeeG] = useState(20);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [showWeightTarget, setShowWeightTarget] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const waterTempC = recipe.defaultTemp;
  const [coffeeInput, setCoffeeInput] = useState(String(20));
  const [ratioInput, setRatioInput] = useState(String(DEFAULT_RATIO));
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const finishedRef = useRef(false);
  const [ariaMsg, setAriaMsg] = useState('');
  const timerIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const prevStepIdxRef = useRef(null);
  const suppressNextChimeRef = useRef(false);

  // audio
  function ensureAudioContextFromGesture() {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  }

  const playTwoToneChime = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const blip = (startTime, freq, durSec) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(durSec - 0.02, 0.05));
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durSec + 0.05);
    };
    blip(now, 660, 0.18);
    blip(now + 0.22, 880, 0.22);
  }, []);

  const safeChime = useCallback(() => {
    if (audioCtxRef.current) {
      try {
        playTwoToneChime();
      } catch {
        /* noop */
      }
    }
  }, [playTwoToneChime]);

  // sync inputs with sliders
  useEffect(() => { setCoffeeInput(String(coffeeG)); }, [coffeeG]);
  useEffect(() => { setRatioInput(String(ratio)); }, [ratio]);
  useEffect(() => {
    hardReset(false);
    setShowInfo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe]);

  // derived step data
  const totalWater = useMemo(() => Math.round(coffeeG * ratio), [coffeeG, ratio]);
  const steps = useMemo(() => recipe.buildSteps(coffeeG, ratio), [recipe, coffeeG, ratio]);
  const stepDurMs = useMemo(() => steps.map(s => s.durationSec * 1000), [steps]);
  const cumEndMs = useMemo(() => {
    const arr = []; let acc = 0; for (const d of stepDurMs) { acc += d; arr.push(acc); } return arr;
  }, [stepDurMs]);
  const totalDurationMs = useMemo(() => (cumEndMs.length ? cumEndMs[cumEndMs.length - 1] : 0), [cumEndMs]);
  const currentStepIdx = useMemo(() => {
    for (let i = 0; i < cumEndMs.length; i++) { if (elapsedMs < cumEndMs[i]) return i; }
    return Math.max(0, steps.length - 1);
  }, [elapsedMs, cumEndMs, steps.length]);
  const stepStartMs = currentStepIdx === 0 ? 0 : cumEndMs[currentStepIdx - 1];
  const stepEndMs = cumEndMs[currentStepIdx] || totalDurationMs;
  const currentStep = steps[currentStepIdx] || steps[steps.length - 1];
  const cumPourTargets = useMemo(() => {
    const arr = []; let acc = 0; for (const s of steps) { if (s.volume > 0) acc += s.volume; arr.push(acc); } return arr;
  }, [steps]);

  // timer engine
  useEffect(() => {
    if (!isRunning) {
      if (timerIdRef.current) { clearInterval(timerIdRef.current); timerIdRef.current = null; }
      return;
    }
    timerIdRef.current = setInterval(() => { setElapsedMs(prev => Math.min(prev + 50, totalDurationMs)); }, 50);
    return () => { if (timerIdRef.current) { clearInterval(timerIdRef.current); timerIdRef.current = null; } };
  }, [isRunning, totalDurationMs]);

  // stop at end
  useEffect(() => {
    if (elapsedMs >= totalDurationMs && totalDurationMs > 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setIsRunning(false);
        safeChime();
        setShowCelebration(true);
        setAriaMsg('Brew complete');
        setTimeout(() => setShowCelebration(false), 1800);
        setTimeout(() => setAriaMsg(''), 2000);
      }
    }
  }, [elapsedMs, totalDurationMs, safeChime]);

  // chime on step change
  useEffect(() => {
    if (prevStepIdxRef.current === null) { prevStepIdxRef.current = currentStepIdx; return; }
    if (suppressNextChimeRef.current) { suppressNextChimeRef.current = false; prevStepIdxRef.current = currentStepIdx; return; }
    if (currentStepIdx !== prevStepIdxRef.current) { safeChime(); prevStepIdxRef.current = currentStepIdx; }
  }, [currentStepIdx, safeChime]);

  // auto scroll
  useEffect(() => {
    const el = document.getElementById(`step-${currentStepIdx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentStepIdx]);

  function hardReset(withGestureResume = true) {
    if (withGestureResume) ensureAudioContextFromGesture();
    if (timerIdRef.current) { clearInterval(timerIdRef.current); timerIdRef.current = null; }
    setIsRunning(false);
    setElapsedMs(0);
    finishedRef.current = false;
    setShowCelebration(false);
    setAriaMsg('');
    suppressNextChimeRef.current = true;
    prevStepIdxRef.current = 0;
  }

  const onStartPause = () => { ensureAudioContextFromGesture(); setIsRunning(r => !r); };
  const onSkip = () => { ensureAudioContextFromGesture(); setElapsedMs(Math.min(stepEndMs, totalDurationMs)); };
  const onPrev = () => { ensureAudioContextFromGesture(); const prevIdx = Math.max(0, currentStepIdx - 1); const target = prevIdx === 0 ? 0 : cumEndMs[prevIdx - 1]; setElapsedMs(target); };
  const onReset = () => { hardReset(); };

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const fmtClock = ms => { const s = Math.max(0, Math.floor(ms / 1000)); const m = Math.floor(s / 60); const rem = s % 60; return `${m}:${rem.toString().padStart(2,'0')}`; };
  const fmtSecs = sec => `${sec}s`;
  const overallProgress = totalDurationMs ? elapsedMs / totalDurationMs : 0;
  const stepProgress = currentStep ? (Math.min(elapsedMs, stepEndMs) - stepStartMs) / (stepEndMs - stepStartMs || 1) : 0;
  const canPrev = elapsedMs > 0;
  const canSkip = elapsedMs < totalDurationMs;
  const remainingMs = Math.max(0, stepEndMs - Math.min(elapsedMs, stepEndMs));
  const remainingSec = Math.ceil(remainingMs / 1000);
  const currentCumTarget = cumPourTargets[currentStepIdx] || 0;
  const inputsLocked = isRunning || elapsedMs > 0;
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  function confettiColor(i) { const palette = ['#ef4444','#f59e0b','#10b981','#3b82f6','#a855f7','#ec4899','#22d3ee','#84cc16']; return palette[i % palette.length]; }

  return (
    <div className="max-w-md mx-auto px-4 pb-28 pt-3">
      <div className="flex items-center justify-between mb-3">
        <button type="button" className="text-[var(--color-light-muted)] text-base underline-offset-4" onClick={() => { hardReset(false); onBack(); }} aria-label="Back">← Back</button>
        <div className="text-sm text-[var(--color-light-muted)] truncate ml-2">{recipe.name}</div>
        <div className="w-12" aria-hidden="true" />
      </div>

      <div className="rounded-2xl bg-[var(--color-card-bg)] shadow-sm border border-[var(--color-card-border)] p-4 mt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[var(--color-text)] font-semibold">{recipe.name}</h2>
          {recipe.desc && !showInfo && (
            <button
              type="button"
              onClick={() => setShowInfo(true)}
              className="text-xs text-[var(--color-muted)] underline"
            >
              See More Info
            </button>
          )}
        </div>
        {showInfo && recipe.desc && (
          <p className="text-[var(--color-muted)] text-sm mt-1">{recipe.desc}</p>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-muted)]">Coffee (g)</label>
            </div>
            <input type="range" min={10} max={40} step={1} value={coffeeG} onChange={e => setCoffeeG(clamp(parseInt(e.target.value,10),10,40))} className="h-12 w-full" disabled={inputsLocked} />
            <div className="flex items-center gap-2 mt-1">
              <input type="number" inputMode="numeric" min={10} max={40} step={1} value={coffeeInput} onChange={e => { const v = e.target.value; setCoffeeInput(v); const n = parseInt(v,10); if (!Number.isNaN(n)) setCoffeeG(clamp(n,10,40)); }} onBlur={() => { const n = parseInt(coffeeInput,10); setCoffeeInput(Number.isNaN(n)? String(coffeeG): String(clamp(n,10,40))); }} className="w-20 h-10 rounded-lg px-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text)]" disabled={inputsLocked} />
              <span className="text-sm text-[var(--color-text)]">{totalWater} g total</span>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-muted)]">Ratio (1:water)</label>
              <button type="button" onClick={() => { setRatio(DEFAULT_RATIO); setRatioInput(String(DEFAULT_RATIO)); }} className="text-xs px-2 py-1 rounded-lg border border-[var(--color-card-border)] bg-[var(--color-bg)] text-[var(--color-text)] disabled:opacity-50" aria-label="Reset ratio to default" disabled={inputsLocked}>Default</button>
            </div>
            <input type="range" min={10} max={18} step={1} value={ratio} onChange={e => { const n = clamp(parseInt(e.target.value,10),10,18); setRatio(n); setRatioInput(String(n)); }} className="h-12 w-full" disabled={inputsLocked} />
            <div className="flex items-center gap-2 mt-1">
              <input type="number" inputMode="numeric" min={10} max={18} step={1} value={ratioInput} onChange={e => { const v = e.target.value; setRatioInput(v); const n = parseInt(v,10); if (!Number.isNaN(n)) setRatio(clamp(n,10,18)); }} onBlur={() => { const n = parseInt(ratioInput,10); setRatioInput(Number.isNaN(n)? String(ratio): String(clamp(n,10,18))); }} className="w-20 h-10 rounded-lg px-2 bg-[var(--color-card-bg)] border border-[var(--color-card-border)] text-[var(--color-text)]" disabled={inputsLocked} />
            </div>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <label className="text-xs text-[var(--color-muted)]">Water temp (°C)</label>
            </div>
            <div className="h-12 flex items-center text-[var(--color-text)]">{waterTempC}°C</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <input id="show-weight" type="checkbox" checked={showWeightTarget} onChange={e => setShowWeightTarget(e.target.checked)} className="h-4 w-4" />
          <label htmlFor="show-weight" className="text-sm text-[var(--color-muted)]">Show cumulative target</label>
        </div>
      </div>

      {/* Timer */}
      <div className="mt-6 rounded-2xl bg-neutral-900/60 border border-neutral-700 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <div className="text-4xl font-semibold tracking-tight">{fmtClock(elapsedMs)}</div>
            <div className="text-[var(--color-light-muted)]">/ {fmtClock(totalDurationMs)}</div>
          </div>
          {showWeightTarget && (
            <div className="text-2xl font-semibold text-[var(--color-light-text)]">{currentCumTarget} g</div>
          )}
        </div>
        <div className="mt-4 h-3 bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500" style={{ width: `${overallProgress * 100}%` }} />
        </div>
        <div className="mt-6 flex justify-center">
          <svg className="w-24 h-24" viewBox="0 0 100 100">
            <circle className="text-neutral-800" stroke="currentColor" strokeWidth="8" fill="transparent" r={radius} cx="50" cy="50" />
            <circle className="text-emerald-400 transition-all" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="transparent" r={radius} cx="50" cy="50" style={{ strokeDasharray: circumference, strokeDashoffset: circumference * (1 - stepProgress) }} />
            <text x="50" y="55" textAnchor="middle" className="fill-white text-xl">{fmtSecs(remainingSec)}</text>
          </svg>
        </div>
        <div className="mt-4 text-sm text-[var(--color-light-muted)]" aria-live="polite">
          <div className="flex items-center justify-between">
            <div className="font-medium">{currentStep?.label || 'Step'}</div>
            <div className="text-[var(--color-light-muted)] text-sm">{currentStep?.volume || 0} g • {fmtSecs(currentStep?.durationSec || 0)}</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={onPrev} disabled={!canPrev} className={["h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium", !canPrev ? "opacity-50 cursor-not-allowed" : ""].join(' ')}>Prev</button>
            <button type="button" onClick={onStartPause} className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold">{isRunning ? 'Pause' : 'Start'}</button>
            <button type="button" onClick={onSkip} disabled={!canSkip} className={["h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium", !canSkip ? "opacity-50 cursor-not-allowed" : ""].join(' ')}>Skip</button>
          </div>
          <button type="button" onClick={onReset} className="mt-3 w-full h-12 rounded-xl border border-[var(--color-light-muted)] bg-neutral-900 text-[var(--color-light-text)] font-medium">Reset</button>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {steps.map((s, i) => {
          const start = i === 0 ? 0 : cumEndMs[i - 1];
          const end = cumEndMs[i];
          const arrow = showWeightTarget ? cumPourTargets[i] : null;
          const isActive = i === currentStepIdx;
          return (
            <Step
              key={i}
              step={s}
              idx={i}
              start={fmtClock(start)}
              end={fmtClock(end)}
              arrow={arrow}
              showWeightTarget={showWeightTarget}
              isActive={isActive}
            />
          );
        })}
      </div>

      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-xl" style={{ animation: 'popIn 300ms ease-out forwards' }}>
              <span className="text-emerald-600 text-5xl leading-none">✓</span>
            </div>
            <div className="absolute inset-0 -translate-x-1/2 left-1/2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="absolute w-2 h-3 rounded-sm" style={{ left: `${10 + (i * 7)}%`, top: '-8px', background: confettiColor(i), animation: `confettiFall ${800 + (i % 5) * 120}ms ease-out ${80 + (i * 30)}ms forwards`, opacity: 0 }} />
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="sr-only" aria-live="polite">{ariaMsg}</div>
    </div>
  );
}
