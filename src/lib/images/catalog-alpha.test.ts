import { describe, expect, it } from 'vitest';
import { cleanCatalogAlpha } from './catalog-alpha';

describe('catalog cutout preparation', () => {
  it('removes detached specks and edge fringe while retaining garment openings', () => {
    const size = 30;
    const pixels = new Uint8ClampedArray(size * size * 4);
    for (let y = 4; y < 26; y++)
      for (let x = 4; x < 26; x++) pixels[(y * size + x) * 4 + 3] = 255;
    pixels[(15 * size + 15) * 4 + 3] = 0;
    pixels[(1 * size + 1) * 4 + 3] = 255;
    const original = pixels.slice();
    const alpha = cleanCatalogAlpha(pixels, size, size);
    expect(alpha[1 * size + 1]).toBe(0);
    expect(alpha[4 * size + 10]).toBe(0);
    expect(alpha[8 * size + 10]).toBe(255);
    expect(alpha[15 * size + 15]).toBe(0);
    expect(pixels).toEqual(original);
  });

  it('handles a fully transparent source without inventing a silhouette', () => {
    expect(cleanCatalogAlpha(new Uint8ClampedArray(100), 5, 5)).toEqual(
      new Uint8ClampedArray(25),
    );
  });
});
