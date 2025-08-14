# BrewMate – V60 Multi-Recipe Timer

**Brief description**  
Mobile-first V60 timer with multiple recipes, pour-based running weight targets, two-tone chimes, and a cute finish celebration. Built with React + Tailwind, tuned for iPhone Safari (WCAG AA on light cards).

## Features
- **Multiple recipes (pills to switch):**
  - Matt Winton — 5-Pour
  - Tetsu Kasuya — 4:6
  - James Hoffmann — Bloom + 60/40
  - James Hoffmann — 5-Pour (2019)
- **Pour-based running weight target** (shows cumulative target per pour; per-step arrows in list).
- **Timer UI:** big conic-gradient ring, elapsed vs total, per-step card with mini progress.
- **Two-tone chime** on every step transition and at finish (iOS user-gesture safe).
- **Finish celebration** overlay (✓ badge + confetti) with ARIA live announcement.
- **Animated coffee icon** highlights the active brewing step.
- **Accessibility & UX:** WCAG AA on light cards, ≥44px tap targets, mobile-first layout.

## Controls & Behaviors
- **Prev:** Jump to start of previous step (updates targets immediately).
- **Start/Pause:** Toggle the timer.
- **Skip:** Jump to end of current step (immediate transition, chime, and target update).
- **Reset:** Pause, set elapsed to 0, hide celebration, suppress the immediate post-reset chime.

**Behavior details**
- **Running target is pour-based, not time-based.** It updates instantly on **Skip/Prev**.
- **Zero-volume steps (Drawdown):** target **holds** at the last non-zero cumulative value.
- **Auto-stop:** Timer stops at total duration; plays finish chime and shows celebration.
- **Audio on iOS:** First tap (e.g., Start) initializes audio; ensure ringer isn’t muted.
