import { it, expect } from 'vitest';
import { closestPhotoColor } from './photo-color';
it('ignores transparent pixels and chooses an allowed named color without altering pixels', () => {
  const pixels = new Uint8ClampedArray([
    255, 255, 255, 0, 39, 57, 79, 255, 39, 57, 79, 255,
  ]);
  const before = pixels.slice();
  expect(closestPhotoColor(pixels, ['white', 'navy', 'black'])).toBe('navy');
  expect(pixels).toEqual(before);
  expect(
    closestPhotoColor(new Uint8ClampedArray([255, 0, 0, 0]), ['white']),
  ).toBeNull();
});
