export const recolorRecipe = 'masked-luminance-v1';

export function recolorPixel(
  source: readonly number[],
  target: readonly number[],
  referenceLightness: number,
  mask: number,
): [number, number, number, number] {
  const luminance =
    source[0] * 0.2126 + source[1] * 0.7152 + source[2] * 0.0722;
  const delta = Math.max(
    -0.72,
    Math.min(0.55, (luminance - referenceLightness) / 255),
  );
  const weight = Math.max(0, Math.min(1, mask));
  const targetLightness =
    target[0] * 0.2126 + target[1] * 0.7152 + target[2] * 0.0722;
  const shadowStrength = targetLightness > 200 ? 0.45 : 1.35;
  const result = target.slice(0, 3).map((channel, index) => {
    const shaded =
      delta < 0
        ? channel * (1 + delta * shadowStrength)
        : channel + (255 - channel) * delta * 0.65;
    return Math.round(
      source[index] * (1 - weight) + Math.max(0, shaded) * weight,
    );
  });
  return [result[0], result[1], result[2], source[3]];
}
