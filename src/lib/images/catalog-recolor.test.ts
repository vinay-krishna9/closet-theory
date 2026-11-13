import { describe, expect, it } from 'vitest';
import { recolorPixel } from './catalog-recolor';

describe('garment-only recoloring', () => {
  it('preserves protected pixels and alpha exactly', () => {
    expect(recolorPixel([210, 214, 219, 173], [110, 40, 60], 180, 0)).toEqual([
      210, 214, 219, 173,
    ]);
    expect(recolorPixel([50, 60, 70, 0], [240, 240, 240], 100, 1)[3]).toBe(0);
  });
  it('maps a neutral reference to the chosen color while retaining shadow/highlight ordering', () => {
    const target = [118, 58, 72];
    expect(recolorPixel([150, 150, 150, 255], target, 150, 1)).toEqual([
      ...target,
      255,
    ]);
    const shadow = recolorPixel([80, 80, 80, 255], target, 150, 1),
      light = recolorPixel([210, 210, 210, 255], target, 150, 1);
    for (let channel = 0; channel < 3; channel++) {
      expect(shadow[channel]).toBeLessThan(target[channel]);
      expect(light[channel]).toBeGreaterThan(target[channel]);
    }
    expect(recolorPixel([80, 80, 80, 255], target, 150, 1)).toEqual(shadow);
  });
  it('keeps light recolorings from turning dark denim shadows into black marks', () => {
    const output = recolorPixel([30, 30, 30, 255], [233, 233, 228], 130, 1);
    expect(output[0]).toBeGreaterThan(180);
    expect(
      recolorPixel([150, 150, 150, 255], [233, 233, 228], 150, 1),
    ).not.toEqual(recolorPixel([150, 150, 150, 255], [220, 213, 189], 150, 1));
  });
});
