import React from 'react';

export default function Home({ recipes, onSelect }) {
  return (
    <div className="max-w-md mx-auto px-4 pb-24 pt-6">
      <header className="mb-4">
        <h1 className="text-xl font-semibold tracking-tight">BrewMate — V60 Timer</h1>
        <p className="text-stone-400 text-sm mt-1">Choose a recipe to begin brewing.</p>
      </header>
      <div className="space-y-3">
        {recipes.map(r => (
          <div key={r.id} className="rounded-2xl bg-stone-50 shadow-sm border border-stone-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-neutral-900 font-semibold">{r.name}</h2>
                <p className="text-stone-700 text-sm mt-0.5">{r.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelect(r.id)}
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
  );
}
