import { colors, type ColorId } from '@/features/onboarding/catalog';

export function closestPhotoColor(
  pixels: Uint8ClampedArray,
  allowed: readonly ColorId[],
): ColorId | null {
  const bins = new Map<number, { count: number; sum: number[] }>();
  const step = Math.max(4, Math.ceil(pixels.length / 4 / 20_000) * 4);
  for (let i = 0; i + 3 < pixels.length; i += step) {
    if (pixels[i + 3] < 128) continue;
    const rgb = [pixels[i], pixels[i + 1], pixels[i + 2]],
      bin = (rgb[0] >> 5) * 64 + (rgb[1] >> 5) * 8 + (rgb[2] >> 5);
    const entry = bins.get(bin) ?? { count: 0, sum: [0, 0, 0] };
    entry.count++;
    rgb.forEach((value, channel) => {
      entry.sum[channel] += value;
    });
    bins.set(bin, entry);
  }
  const dominant = [...bins.values()].sort((a, b) => b.count - a.count)[0];
  if (!dominant || !allowed.length) return null;
  const rgb = dominant.sum.map((value) => value / dominant.count);
  return [...allowed].sort((left, right) => {
    const distance = (color: ColorId) =>
      [0, 1, 2].reduce(
        (total, channel) =>
          total +
          (rgb[channel] -
            parseInt(
              colors[color].hex.slice(1 + channel * 2, 3 + channel * 2),
              16,
            )) **
            2,
        0,
      );
    return distance(left) - distance(right);
  })[0];
}
