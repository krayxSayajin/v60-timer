export const RECIPES = [
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
        { label: "Drawdown", volume: 0, durationSec: 80 },
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
        { label: "Drawdown", volume: 0, durationSec: 105 },
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
];
