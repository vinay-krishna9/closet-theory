import { it, expect } from 'vitest';
import sharp from 'sharp';
import { photoHeader, photoLimits } from './photo-validation';

it.each(['jpeg', 'png', 'webp'] as const)(
  'reads real %s dimensions from bytes rather than a filename or MIME claim',
  async (format) => {
    const bytes = await sharp({
      create: { width: 41, height: 29, channels: 3, background: '#52627c' },
    })
      .toFormat(format)
      .toBuffer();
    expect(photoHeader(bytes)).toEqual({ format, width: 41, height: 29 });
    expect(() => photoHeader(bytes.subarray(0, 13))).toThrow();
  },
);
it('recognizes lossless WebP and rejects malformed, oversized, huge-pixel and animated inputs', async () => {
  const source = sharp({
    create: { width: 10, height: 12, channels: 4, background: '#56789a88' },
  });
  expect(
    photoHeader(await source.clone().webp({ lossless: true }).toBuffer()).width,
  ).toBe(10);
  expect(() => photoHeader(new TextEncoder().encode('<svg></svg>'))).toThrow(
    'JPEG',
  );
  expect(() => photoHeader(new Uint8Array(photoLimits.bytes + 1))).toThrow(
    '10 MiB',
  );
  const png = await source.clone().png().toBuffer();
  png.writeUInt32BE(100_000, 16);
  png.writeUInt32BE(100_000, 20);
  expect(() => photoHeader(png)).toThrow('25 megapixels');
  const webp = await source.clone().webp().toBuffer();
  // Transparent WebP emits VP8X; its animation flag is rejected before decoding.
  expect(webp.toString('ascii', 12, 16)).toBe('VP8X');
  webp[20] |= 2;
  expect(() => photoHeader(webp)).toThrow('still photo');
});
