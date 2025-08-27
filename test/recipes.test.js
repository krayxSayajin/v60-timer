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

  it('kasuyaSwitch splits water evenly', () => {
    const r = RECIPES.find(r => r.id === 'kasuyaSwitch');
    const steps = r.buildSteps(20, 16);
    expect(steps).toHaveLength(3);
    expect(steps[0].volume).toBe(steps[1].volume);
    const total = steps.reduce((a, s) => a + s.volume, 0);
    expect(total).toBe(Math.round(20 * 16));
  });

  it('provides recipe-specific default ratios', () => {
    const expected = {
      winton5: 15,
      kasuya46: 15,
      kasuyaSwitch: 16,
      hoffmann6040: 15,
      hoffmann5: 15,
    };
    for (const [id, ratio] of Object.entries(expected)) {
      const r = RECIPES.find(rcp => rcp.id === id);
      expect(r.defaultRatio).toBe(ratio);
    }
  });
});
