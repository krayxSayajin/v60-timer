import { describe, it, expect } from 'vitest';
import { RECIPES } from '../src/recipes.js';

describe('recipe builders', () => {
  it('winton5 totals coffee ratio', () => {
    const r = RECIPES.find(r => r.id === 'winton5');
    const steps = r.buildSteps(20, 15);
    const total = steps.reduce((a, s) => a + s.volume, 0);
    expect(total).toBe(Math.round(20 * 15));
  });

  it('kasuya46 yields six steps', () => {
    const r = RECIPES.find(r => r.id === 'kasuya46');
    const steps = r.buildSteps(18, 15);
    expect(steps).toHaveLength(6);
  });
});
