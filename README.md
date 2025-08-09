# BrewMate – V60 Multi-Recipe Timer

A mobile-first V60 pour-over timer with multiple recipes, pour-based running weight targets, gentle two-tone chimes, and a cute finish celebration. Built with React 18 + Tailwind CSS v4 (Vite), tuned for iPhone Safari, and designed to pass WCAG AA contrast on light cards.

**Live demo:** https://krayxSayajin.github.io/v60-timer/

---

## Features

- **Multiple recipes** (switch with top pills)
  - Matt Winton — 5-Pour
  - Tetsu Kasuya — 4:6
  - James Hoffmann — Bloom + 60/40
  - James Hoffmann — 5-Pour (2019)
- **Pour-based running weight target**
  - Shows the *cumulative* target per pour (and per-step arrows)
  - Updates instantly on **Skip**/**Prev** (not time-based)
- **Timer UI**
  - Big conic-gradient progress ring with inner cutout
  - Elapsed time + total time
  - Current step card + mini step progress
- **Two-tone chime** on every step transition and at finish (iOS-safe; one tap unlock)
- **Finish celebration** overlay (✓ badge + confetti) with ARIA live announcement
- **Accessibility**
  - WCAG AA on light cards
  - Large tap targets (≥44px)
  - Mobile-first layout

---

## Tech stack

- React 18 (hooks)
- Tailwind CSS v4 with `@tailwindcss/vite`
- Vite (dev server + build)
- No external UI libraries

---

## Quick start (local)

> Prereqs: Node 18+ (Node 20 LTS recommended) and Git.

```bash
# clone and install
git clone https://github.com/krayxSayajin/v60-timer.git
cd v60-timer
npm install

# run on LAN so your iPhone can test it
npm run dev -- --host
