export const RECIPES = [
  {
    id: "winton5",
    name: "Matt Winton — 5-Pour",
    desc: "Five equal pours; gentle pace and even bed.",
    defaultTemp: 93,
    defaultRatio: 15,
    buildSteps: (coffeeG, ratio) => {
      const total = Math.round(coffeeG * ratio);
      const per = Math.round(total / 5);
      return [
        { label: "Pour 1", volume: per, durationSec: 30 },
        { label: "Pour 2", volume: per, durationSec: 25 },
        { label: "Pour 3", volume: per, durationSec: 25 },
        { label: "Pour 4", volume: per, durationSec: 25 },
        { label: "Pour 5", volume: per, durationSec: 25 },
        { label: "Drawdown", volume: 0, durationSec: 40 },
      ];
    },
  },
  {
    id: "kasuya46",
    name: "Tetsu Kasuya — 4:6",
    desc: "First 40% for taste (2 pours), last 60% for strength (3 pours).",
    defaultTemp: 93,
    defaultRatio: 15,
    buildSteps: (coffeeG, ratio) => {
      const total = Math.round(coffeeG * ratio);
      const p1 = Math.round(total * (1 / 6)); // ~50g of 300g
      const p2 = Math.round(total * (7 / 30)); // ~70g of 300g
      const p3 = Math.round(total * (1 / 5)); // ~60g of 300g
      const p4 = Math.round(total * (1 / 5));
      const p5 = total - (p1 + p2 + p3 + p4); // ensure sums to total
      return [
        { label: "Taste 1", volume: p1, durationSec: 45 },
        { label: "Taste 2", volume: p2, durationSec: 45 },
        { label: "Strength 1", volume: p3, durationSec: 45 },
        { label: "Strength 2", volume: p4, durationSec: 45 },
        { label: "Strength 3", volume: p5, durationSec: 45 },
        { label: "Drawdown", volume: 0, durationSec: 30 },
      ];
    },
  },
  {
    id: "kasuyaSwitch",
    name: "Tetsu Kasuya — Switch",
    desc: "Two equal pours with a closed steep, then open to drain.",
    defaultTemp: 93,
    defaultRatio: 16,
    buildSteps: (coffeeG, ratio) => {
      const total = Math.round(coffeeG * ratio);
      const p1 = Math.round(total / 2);
      const p2 = total - p1; // ensure sums to total
      return [
        { label: "Pour 1 - Close Switch When Done", volume: p1, durationSec: 45 },
        { label: "Pour 2 - Closed", volume: p2, durationSec: 75 },
        { label: "Drawdown - Open Switch", volume: 0, durationSec: 60 },
      ];
    },
  },
  {
    id: "hoffmann6040",
    name: "James Hoffmann — Bloom + 60/40",
    desc: "Bloom ~2× coffee for 45s, then 60/40 split.",
    defaultTemp: 100,
    defaultRatio: 15,
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
    defaultRatio: 15,
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
