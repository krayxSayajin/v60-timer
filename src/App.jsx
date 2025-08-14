import React, { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  // -----------------------------
  // Recipe definitions
  // -----------------------------
  const RECIPES = useMemo(
    () => ([
      {
        id: "winton5",
        name: "Matt Winton — 5-Pour",
        desc: "Five equal pours; gentle pace and even bed.",
        defaultTemp: 93,
        buildSteps: (coffeeG, ratio) => {
          const total = Math.round(coffeeG * ratio);
          const per = Math.round(total / 5);
          return [
            { label: "Pour 1", volume: per, durationSec: 30 },
            { label: "Pour 2", volume: per, durationSec: 25 },
            { label: "Pour 3", volume: per, durationSec: 25 },
            { label: "Pour 4", volume: per, durationSec: 25 },
            { label: "Pour 5", volume: per, durationSec: 25 },
            { label: "Drawdown", volume: 0, durationSec: 80 }, // total ≈ 3:30
          ];
        },
      },
      {
        id: "kasuya46",
        name: "Tetsu Kasuya — 4:6",
        desc: "First 40% for taste (2 pours), last 60% for strength (3 pours).",
        defaultTemp: 93,
        buildSteps: (coffeeG, ratio) => {
          const total = Math.round(coffeeG * ratio);
          const p20 = Math.round(total * 0.20);
          return [
            { label: "Taste 1", volume: p20, durationSec: 25 },
            { label: "Taste 2", volume: p20, durationSec: 25 },
            { label: "Strength 1", volume: p20, durationSec: 25 },
            { label: "Strength 2", volume: p20, durationSec: 25 },
            { label: "Strength 3", volume: p20, durationSec: 25 },
            { label: "Drawdown", volume: 0, durationSec: 90 },
          ];
        },
      },
      {
        id: "hoffmann6040",
        name: "James Hoffmann — Bloom + 60/40",
        desc: "Bloom ~2× coffee for 45s, then 60/40 split.",
        defaultTemp: 100,
        buildSteps: (coffeeG, ratio) => {
          const total = Math.round(coffeeG * ratio);
          const bloom = Math.round(coffeeG * 2);
          const to60 = Math.max(Math.round(total * 0.6) - bloom, 0);
          const to100 = Math.max(total - bloom - to60, 0);
          return [
            { label: "Bloom", volume: bloom, durationSec: 45 },
            { label: "Main Pour 1 (to ~60%)", volume: to60, durationSec: 30 },
            { label: "Main Pour 2 (to 100%)", volume: to100, durationSec: 30 },
            { label: "Drawdown", volume: 0, durationSec: 105 }, // total ≈ 3:30
          ];
        },
      },
      {
        id: "hoffmann5",
        name: "James Hoffmann — 5-Pour (2019)",
        desc: "Bloom ~2× coffee, then 4 equal pours.",
        defaultTemp: 100,
        buildSteps: (coffeeG, ratio) => {
          const total = Math.round(coffeeG * ratio);
          const bloom = Math.round(coffeeG * 2);
          const remaining = Math.max(total - bloom, 0);
          const per = Math.round(remaining / 4);
          return [
            { label: "Bloom", volume: bloom, durationSec: 45 },
            { label: "Pour 1", volume: per, durationSec: 30 },
            { label: "Pour 2", volume: per, durationSec: 30 },
            { label: "Pour 3", volume: per, durationSec: 30 },
            { label: "Pour 4", volume: per, durationSec: 30 },
            { label: "Drawdown", volume: 0, durationSec: 90 },
          ];
        },
      },
    ]),
    []
  );

  // -----------------------------
  // App state
  // -----------------------------
  const DEFAULT_RATIO = 15;

  const [screen, setScreen] = useState("home"); // 'home' | 'brew'
  const [activeId, setActiveId] = useState(RECIPES[0].id);
  const activeRecipe = useMemo(
    () => RECIPES.find(r => r.id === activeId),
    [RECIPES, activeId]
  );

  const [coffeeG, setCoffeeG] = useState(20);
  const [ratio, setRatio] = useState(DEFAULT_RATIO);
  const [waterTempC, setWaterTempC] = useState(activeRecipe.defaultTemp);
  const [showWeightTarget, setShowWeightTarget] = useState(true);

  // text inputs that won’t fight typing (allow empty/partial)
  const [coffeeInput, setCoffeeInput] = useState(String(20));
  const [ratioInput, setRatioInput] = useState(String(DEFAULT_RATIO));

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const [showCelebration, setShowCelebration] = useState(false);
  const finishedRef = useRef(false);
  const [ariaMsg, setAriaMsg] = useState("");

  // Timer / audio refs
  const timerIdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const prevStepIdxRef = useRef(null);
  const suppressNextChimeRef = useRef(false);

  // Sync string inputs whenever numeric states change externally (sliders/reset)
  useEffect(() => { setCoffeeInput(String(coffeeG)); }, [coffeeG]);
  useEffect(() => { setRatioInput(String(ratio)); }, [ratio]);

  // When switching recipes, set default temp and reset without an immediate chime
  useEffect(() => {
    setWaterTempC(activeRecipe.defaultTemp);
    hardReset(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // -----------------------------
  // Derived step data
  // -----------------------------
  const totalWater = useMemo(() => Math.round(coffeeG * ratio), [coffeeG, ratio]);

  const steps = useMemo(() => {
    return activeRecipe.buildSteps(coffeeG, ratio);
  }, [activeRecipe, coffeeG, ratio]);

  const stepDurMs = useMemo(() => steps.map(s => s.durationSec * 1000), [steps]);

  const cumEndMs = useMemo(() => {
    const arr = [];
    let acc = 0;
    for (const d of stepDurMs) {
      acc += d;
      arr.push(acc);
    }
    return arr;
  }, [stepDurMs]);

  const totalDurationMs = useMemo(
    () => (cumEndMs.length ? cumEndMs[cumEndMs.length - 1] : 0),
    [cumEndMs]
  );

  const currentStepIdx = useMemo(() => {
    for (let i = 0; i < cumEndMs.length; i++) {
      if (elapsedMs < cumEndMs[i]) return i;
    }
    return Math.max(0, steps.length - 1);
  }, [elapsedMs, cumEndMs, steps.length]);

  const stepStartMs = currentStepIdx === 0 ? 0 : cumEndMs[currentStepIdx - 1];
  const stepEndMs = cumEndMs[currentStepIdx] || totalDurationMs;
  const currentStep = steps[currentStepIdx] || steps[steps.length - 1];

  // Cumulative pour targets (by step end). Zero-volume steps carry the last value.
  const cumPourTargets = useMemo(() => {
    const arr = [];
    let acc = 0;
    for (const s of steps) {
      if (s.volume > 0) acc += s.volume;
      arr.push(acc);
    }
    return arr;
  }, [steps]);

  const currentPourTarget = useMemo(
    () => cumPourTargets[Math.min(currentStepIdx, cumPourTargets.length - 1)] || 0,
    [cumPourTargets, currentStepIdx]
  );

  // -----------------------------
  // Timer engine
  // -----------------------------
  useEffect(() => {
    if (!isRunning) {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
      return;
    }
    timerIdRef.current = setInterval(() => {
      setElapsedMs(prev => Math.min(prev + 50, totalDurationMs));
    }, 50);
    return () => {
      if (timerIdRef.current) {
        clearInterval(timerIdRef.current);
        timerIdRef.current = null;
      }
    };
  }, [isRunning, totalDurationMs]);

  // Stop automatically at end + celebration
  useEffect(() => {
    if (elapsedMs >= totalDurationMs && totalDurationMs > 0) {
      if (!finishedRef.current) {
        finishedRef.current = true;
        setIsRunning(false);
        safeChime(); // finish chime
        setShowCelebration(true);
        setAriaMsg("Brew complete");
        setTimeout(() => setShowCelebration(false), 1800);
        setTimeout(() => setAriaMsg(""), 2000);
      }
    }
  }, [elapsedMs, totalDurationMs]);

  // Chime on step transitions (after first mount, and not right after reset)
  useEffect(() => {
    if (prevStepIdxRef.current === null) {
      prevStepIdxRef.current = currentStepIdx;
      return;
    }
    if (suppressNextChimeRef.current) {
      suppressNextChimeRef.current = false;
      prevStepIdxRef.current = currentStepIdx;
      return;
    }
    if (currentStepIdx !== prevStepIdxRef.current) {
      safeChime();
      prevStepIdxRef.current = currentStepIdx;
    }
  }, [currentStepIdx]);

  // Auto-scroll active step into view
  useEffect(() => {
    const el = document.getElementById(`step-${currentStepIdx}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [currentStepIdx]);

  // -----------------------------
  // Audio (two-tone chime), iOS-friendly
  // -----------------------------
  function ensureAudioContextFromGesture() {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return; // fallback: no audio support
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  }

  function playTwoToneChime() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;

    const blip = (startTime, freq, durSec) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + Math.max(durSec - 0.02, 0.05));
      osc.connect(gain).connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durSec + 0.05);
    };

    // ~660 Hz for ~0.18s, then ~880 Hz for ~0.22s, spaced ~0.22s
    blip(now, 660, 0.18);
    blip(now + 0.22, 880, 0.22);
  }

  function safeChime() {
    if (audioCtxRef.current) {
      try { playTwoToneChime(); } catch { /* noop */ }
    }
  }

  // -----------------------------
  // Controls
  // -----------------------------
  function hardReset(withGestureResume = true) {
    if (withGestureResume) ensureAudioContextFromGesture();
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
    setIsRunning(false);
    setElapsedMs(0);
    finishedRef.current = false;
    setShowCelebration(false);
    setAriaMsg("");
    suppressNextChimeRef.current = true; // suppress immediate post-reset chime
    prevStepIdxRef.current = 0;
  }

  const onStartPause = () => {
    ensureAudioContextFromGesture();
    setIsRunning(r => !r);
  };

  const onSkip = () => {
    ensureAudioContextFromGesture();
    setElapsedMs(Math.min(stepEndMs, totalDurationMs)); // jump to end of current step
  };

  const onPrev = () => {
    ensureAudioContextFromGesture();
    const prevIdx = Math.max(0, currentStepIdx - 1);
    const target = prevIdx === 0 ? 0 : cumEndMs[prevIdx - 1];
    setElapsedMs(target);
  };

  const onReset = () => {
    hardReset();
  };

  // -----------------------------
  // Small helpers (UI / formatting)
  // -----------------------------
  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

  const fmtClock = (ms) => {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem.toString().padStart(2, "0")}`;
  };

  const fmtSecs = (sec) => `${sec}s`;

  const overallProgress = totalDurationMs ? elapsedMs / totalDurationMs : 0;
  const stepProgress = currentStep
    ? (Math.min(elapsedMs, stepEndMs) - stepStartMs) / (stepEndMs - stepStartMs || 1)
    : 0;

  const canPrev = elapsedMs > 0;
  const canSkip = elapsedMs < totalDurationMs;

  function shortName(full) {
    if (full.includes("Matt Winton")) return "Winton — 5-Pour";
    if (full.includes("Tetsu Kasuya")) return "Kasuya — 4:6";
    if (full.includes("Bloom + 60/40")) return "Hoffmann — 60/40";
    if (full.includes("2019")) return "Hoffmann — 5-Pour";
    return full;
  }

  function confettiColor(i) {
    const palette = ["#ef4444","#f59e0b","#10b981","#3b82f6","#a855f7","#ec4899","#22d3ee","#84cc16"];
    return palette[i % palette.length];
  }

  // -----------------------------
  // Dev self-tests (console)
  // -----------------------------
  useEffect(() => {
    try {
      const testWinton = RECIPES.find(r => r.id === "winton5");
      const testKasuya = RECIPES.find(r => r.id === "kasuya46");
      const testH6040 = RECIPES.find(r => r.id === "hoffmann6040");
      const testH5   = RECIPES.find(r => r.id === "hoffmann5");

      // Winton total water = coffee*ratio; first five equal per
      {
        const cg = 20, ra = 15, tot = Math.round(cg * ra);
        const st = testWinton.buildSteps(cg, ra);
        console.assert(tot === 300, "Winton total should be 300 for 20g:1:15");
        const per = Math.round(tot / 5);
        for (let i = 0; i < 5; i++) console.assert(st[i].volume === per, "Winton pours equal");
      }

      // Kasuya 4:6: each pour ~20% total (±2g tolerance)
      {
        const cg = 18, ra = 15, tot = Math.round(cg * ra);
        const st = testKasuya.buildSteps(cg, ra);
        const target = Math.round(tot * 0.20);
        st.slice(0,5).forEach((s, i) => {
          console.assert(Math.abs(s.volume - target) <= 2, `Kasuya pour ${i+1} ~20%`);
        });
      }

      // Hoffmann 60/40: bloom ≈ 2× coffee; cumulative after Main1 ≈ 60% total
      {
        const cg = 20, ra = 15, tot = Math.round(cg * ra);
        const st = testH6040.buildSteps(cg, ra);
        const bloom = st[0].volume;
        console.assert(Math.abs(bloom - cg * 2) <= 1, "H60/40 bloom ~2× coffee");
        const cumAfterMain1 = bloom + st[1].volume;
        console.assert(Math.abs(cumAfterMain1 - Math.round(tot * 0.6)) <= 2, "H60/40 hits ~60%");
      }

      // Hoffmann 5-Pour: includes Drawdown step
      {
        const st = testH5.buildSteps(20, 15);
        console.assert(st[st.length - 1].label === "Drawdown", "H2019 has Drawdown");
      }

      // Winton cumulative holds during Drawdown (18g, 1:15)
      {
        const st = testWinton.buildSteps(18, 15);
        let acc = 0;
        const cum = st.map(s => (s.volume > 0 ? (acc += s.volume) : acc));
        const holds = st[st.length-1].volume === 0 ? cum[cum.length-1] === cum[cum.length-2] : true;
        console.assert(holds, "Cumulative target holds in Drawdown");
      }
    } catch {
      // ignore
    }
  }, [RECIPES]);

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-stone-800 text-stone-200">
      {/* Inline keyframes for finish celebration */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(140px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      {/* ARIA live region for completion */}
      <div className="sr-only" aria-live="polite">{ariaMsg}</div>

      {screen === "home" ? (
        // ----------------- HOME SCREEN -----------------
        <div className="max-w-md mx-auto px-4 pb-24 pt-6">
          <header className="mb-4">
            <h1 className="text-xl font-semibold tracking-tight">BrewMate — V60 Timer</h1>
            <p className="text-stone-400 text-sm mt-1">Choose a recipe to begin brewing.</p>
          </header>

          <div className="space-y-3">
            {RECIPES.map((r) => (
              <div key={r.id} className="rounded-2xl bg-stone-50 shadow-sm border border-stone-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-neutral-900 font-semibold">{r.name}</h2>
                    <p className="text-stone-700 text-sm mt-0.5">{r.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setActiveId(r.id); setScreen("brew"); }}
                    className="shrink-0 min-h-11 px-3 rounded-xl border border-stone-300 bg-stone-100 text-stone-900 text-sm font-medium"
                    aria-label={`Brew ${r.name}`}
                  >
                    Brew
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // ----------------- BREW SCREEN -----------------
        <div className="max-w-md mx-auto px-4 pb-28 pt-3">
          {/* Top bar with Back + active recipe */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              className="text-stone-200 text-base underline-offset-4"
              onClick={() => { hardReset(false); setScreen("home"); }}
              aria-label="Back"
            >
              ← Back
            </button>
            <div className="text-sm text-stone-300 truncate ml-2">{activeRecipe.name}</div>
            <div className="w-12" aria-hidden="true" />{/* spacer */}
          </div>

          {/* Active recipe summary card */}
          <div className="rounded-2xl bg-stone-50 shadow-sm border border-stone-200 p-4 mt-1">
            <h2 className="text-neutral-900 font-semibold">{activeRecipe.name}</h2>
            <p className="text-stone-700 text-sm">{activeRecipe.desc}</p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {/* Coffee (slider + number input) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-stone-700">Coffee (g)</label>
                </div>
                <input
                  type="range"
                  min={10}
                  max={40}
                  step={1}
                  value={coffeeG}
                  onChange={(e) => setCoffeeG(clamp(parseInt(e.target.value, 10), 10, 40))}
                  className="h-12 w-full"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={10}
                    max={40}
                    step={1}
                    value={coffeeInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setCoffeeInput(v);
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n)) setCoffeeG(clamp(n, 10, 40));
                    }}
                    onBlur={() => {
                      const n = parseInt(coffeeInput, 10);
                      setCoffeeInput(Number.isNaN(n) ? String(coffeeG) : String(clamp(n, 10, 40)));
                    }}
                    className="w-20 h-10 rounded-lg px-2 bg-white border border-stone-300 text-neutral-900"
                  />
                  <span className="text-sm text-neutral-900">{totalWater} g total</span>
                </div>
              </div>

              {/* Ratio (slider + number + default) */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-stone-700">Ratio (1:water)</label>
                  <button
                    type="button"
                    onClick={() => { setRatio(DEFAULT_RATIO); setRatioInput(String(DEFAULT_RATIO)); }}
                    className="text-xs px-2 py-1 rounded-lg border border-stone-300 bg-stone-100 text-stone-900"
                    aria-label="Reset ratio to default"
                  >
                    Default
                  </button>
                </div>
                <input
                  type="range"
                  min={10}
                  max={18}
                  step={1}
                  value={ratio}
                  onChange={(e) => {
                    const n = clamp(parseInt(e.target.value, 10), 10, 18);
                    setRatio(n);
                    setRatioInput(String(n));
                  }}
                  className="h-12 w-full"
                />
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={10}
                    max={18}
                    step={1}
                    value={ratioInput}
                    onChange={(e) => {
                      const v = e.target.value;
                      setRatioInput(v);
                      const n = parseInt(v, 10);
                      if (!Number.isNaN(n)) setRatio(clamp(n, 10, 18));
                    }}
                    onBlur={() => {
                      const n = parseInt(ratioInput, 10);
                      setRatioInput(Number.isNaN(n) ? String(ratio) : String(clamp(n, 10, 18)));
                    }}
                    className="w-20 h-10 rounded-lg px-2 bg-white border border-stone-300 text-neutral-900"
                  />
                  <span className="text-sm text-neutral-900">1:{ratio}</span>
                </div>
              </div>

              {/* Temp (read-only per recipe) */}
              <div className="flex flex-col">
                <label className="text-xs text-stone-700">Water temp (°C)</label>
                <input
                  type="number"
                  value={waterTempC}
                  readOnly
                  className="h-12 rounded-xl px-3 bg-gray-200 border border-stone-300 text-neutral-900 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-stone-700">
                Total water: <span className="font-semibold text-neutral-900">{totalWater} g</span>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="toggleTarget" className="text-sm text-stone-700">Running weight target</label>
                <input
                  id="toggleTarget"
                  type="checkbox"
                  checked={showWeightTarget}
                  onChange={(e) => setShowWeightTarget(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Timer / ring (CURRENT STEP time only) */}
          <div className="mt-5">
            <div className="relative w-64 h-64 mx-auto">
              {/* Track/progress via conic-gradient (step progress) */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(#f59e0b ${Math.max(0, Math.min(1, stepProgress)) * 360}deg, #374151 0deg)`
                }}
                aria-hidden="true"
              />
              {/* Inner cutout */}
              <div className="absolute inset-3 rounded-full bg-neutral-900 border border-neutral-800" aria-hidden="true" />
              {/* Center timer text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-semibold tabular-nums">{fmtClock(elapsedMs - stepStartMs)}</div>
                <div className="text-stone-400 text-sm">of {fmtClock(stepEndMs - stepStartMs)}</div>
                {showWeightTarget && (
                  <div className="mt-2 text-emerald-400 text-sm">
                    Target: <span className="font-semibold">{currentPourTarget} g</span>
                  </div>
                )}
              </div>
            </div>

            {/* TOTAL (GLOBAL) TIMER BAR — labeled */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-stone-300 mb-1">
                <span>Total time</span>
                <span>{fmtClock(elapsedMs)} / {fmtClock(totalDurationMs)}</span>
              </div>
              <div className="h-2 rounded-full bg-neutral-700 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(0, overallProgress * 100))}%`, backgroundColor: "#f59e0b" }}
                />
              </div>
            </div>
          </div>

          {/* Current step panel (no mini step bar now) */}
          <div className="mt-5 rounded-2xl bg-neutral-800/60 border border-neutral-700 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium">{currentStep?.label || "Step"}</div>
              <div className="text-stone-300 text-sm">
                {currentStep?.volume || 0} g • {fmtSecs(currentStep?.durationSec || 0)}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={onPrev}
                disabled={!canPrev}
                className={[
                  "h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium",
                  !canPrev ? "opacity-50 cursor-not-allowed" : ""
                ].join(" ")}
              >
                Prev
              </button>
              <button
                type="button"
                onClick={onStartPause}
                className="h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold"
              >
                {isRunning ? "Pause" : "Start"}
              </button>
              <button
                type="button"
                onClick={onSkip}
                disabled={!canSkip}
                className={[
                  "h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium",
                  !canSkip ? "opacity-50 cursor-not-allowed" : ""
                ].join(" ")}
              >
                Skip
              </button>
            </div>

            <button
              type="button"
              onClick={onReset}
              className="mt-3 w-full h-12 rounded-xl border border-stone-500 bg-neutral-900 text-stone-200 font-medium"
            >
              Reset
            </button>
          </div>

          {/* Step list */}
          <div className="mt-5 space-y-2">
            {steps.map((s, i) => {
              const start = i === 0 ? 0 : cumEndMs[i - 1];
              const end = cumEndMs[i];
              const arrow = showWeightTarget ? cumPourTargets[i] : null;
              const isActivePour = i === currentStepIdx && s.volume > 0; // highlight during pours
              return (
                <div
                  id={`step-${i}`}
                  key={i}
                  className={[
                    "relative rounded-xl border p-3 transition-colors",
                    isActivePour
                      ? "bg-emerald-500/10 border-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]"
                      : "bg-neutral-800/60 border-neutral-700"
                  ].join(" ")}
                  aria-current={isActivePour ? "step" : undefined}
                >
                  {isActivePour && (
                    <div
                      className="absolute left-0 top-0 h-full w-1.5 bg-emerald-400 rounded-l-xl"
                      aria-hidden="true"
                    />
                  )}
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{s.label}</div>
                    <div className="text-stone-300 text-sm">{s.volume} g • {fmtSecs(s.durationSec)}</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-stone-400">
                    <div>start {fmtClock(start)}</div>
                    <div>end {fmtClock(end)}</div>
                  </div>
                  {showWeightTarget && (
                    <div className="mt-1 text-emerald-400 text-xs">→ {arrow} g</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative">
            <div
              className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-xl"
              style={{ animation: "popIn 300ms ease-out forwards" }}
            >
              <span className="text-emerald-600 text-5xl leading-none">✓</span>
            </div>
            {/* Confetti */}
            <div className="absolute inset-0 -translate-x-1/2 left-1/2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-3 rounded-sm"
                  style={{
                    left: `${10 + (i * 7)}%`,
                    top: `-8px`,
                    background: confettiColor(i),
                    animation: `confettiFall ${800 + (i % 5) * 120}ms ease-out ${80 + (i * 30)}ms forwards`,
                    opacity: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}