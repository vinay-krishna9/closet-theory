export const photoLimits = {
  bytes: 10 * 1024 * 1024,
  pixels: 25_000_000,
  longestEdge: 1600,
} as const;
export type PhotoHeader = {
  format: 'jpeg' | 'png' | 'webp';
  width: number;
  height: number;
};
const invalid = () =>
  new Error(
    'Choose a valid JPEG, PNG or WebP photo. Convert HEIC or other formats first.',
  );
export function photoHeader(bytes: Uint8Array): PhotoHeader {
  if (!bytes.length || bytes.length > photoLimits.bytes)
    throw new Error('Choose a photo no larger than 10 MiB.');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (at: number, length: number) =>
    String.fromCharCode(...bytes.subarray(at, at + length));
  let format: PhotoHeader['format'],
    width = 0,
    height = 0;
  if (
    bytes.length >= 24 &&
    text(0, 8) === '\x89PNG\r\n\x1a\n' &&
    text(12, 4) === 'IHDR'
  ) {
    format = 'png';
    width = view.getUint32(16);
    height = view.getUint32(20);
    for (let at = 8; at + 12 <= bytes.length;) {
      const size = view.getUint32(at);
      if (text(at + 4, 4) === 'acTL')
        throw new Error('Choose a still photo rather than an animation.');
      if (size > bytes.length - at - 12) throw invalid();
      at += size + 12;
    }
  } else if (
    bytes.length >= 12 &&
    text(0, 4) === 'RIFF' &&
    text(8, 4) === 'WEBP'
  ) {
    format = 'webp';
    if (view.getUint32(4, true) !== bytes.length - 8) throw invalid();
    for (let at = 12; at + 8 <= bytes.length;) {
      const size = view.getUint32(at + 4, true),
        start = at + 8,
        kind = text(at, 4);
      if (size > bytes.length - start) throw invalid();
      if (kind === 'VP8X' && size >= 10) {
        if (bytes[start] & 2)
          throw new Error('Choose a still photo rather than an animation.');
        width =
          1 +
          bytes[start + 4] +
          (bytes[start + 5] << 8) +
          (bytes[start + 6] << 16);
        height =
          1 +
          bytes[start + 7] +
          (bytes[start + 8] << 8) +
          (bytes[start + 9] << 16);
      } else if (
        kind === 'VP8L' &&
        size >= 5 &&
        bytes[start] === 0x2f &&
        !width
      ) {
        const bits = view.getUint32(start + 1, true);
        width = (bits & 0x3fff) + 1;
        height = ((bits >>> 14) & 0x3fff) + 1;
      } else if (
        kind === 'VP8 ' &&
        size >= 10 &&
        text(start + 3, 3) === '\x9d\x01\x2a' &&
        !width
      ) {
        width = view.getUint16(start + 6, true) & 0x3fff;
        height = view.getUint16(start + 8, true) & 0x3fff;
      }
      at += size + 8 + (size & 1);
    }
  } else if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    format = 'jpeg';
    let at = 2;
    while (at + 3 < bytes.length) {
      if (bytes[at++] !== 0xff) throw invalid();
      while (bytes[at] === 0xff) at++;
      const marker = bytes[at++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (at + 2 > bytes.length) throw invalid();
      const size = view.getUint16(at);
      if (size < 2 || size > bytes.length - at) throw invalid();
      if (
        [
          0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd,
          0xce, 0xcf,
        ].includes(marker)
      ) {
        if (size < 8) throw invalid();
        height = view.getUint16(at + 3);
        width = view.getUint16(at + 5);
        break;
      }
      at += size;
    }
  } else throw invalid();
  if (!width || !height) throw invalid();
  if (width * height > photoLimits.pixels)
    throw new Error('Choose a photo with no more than 25 megapixels.');
  return { format, width, height };
}
