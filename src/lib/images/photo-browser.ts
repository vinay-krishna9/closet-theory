import { photoHeader, photoLimits } from './photo-validation';
export type CleanPhoto = {
  blob: Blob;
  pixels: Uint8ClampedArray;
  width: number;
  height: number;
};
export async function cleanPhoto(file: File): Promise<CleanPhoto> {
  if (file.size > photoLimits.bytes)
    throw new Error('Choose a photo no larger than 10 MiB.');
  photoHeader(new Uint8Array(await file.arrayBuffer()));
  // Re-encoding through pixels preserves orientation and drops EXIF/location
  // metadata. Even Use original uses this sanitized copy, never the raw file.
  const bitmap = await createImageBitmap(file, {
    imageOrientation: 'from-image',
  });
  try {
    const scale = Math.min(
      1,
      photoLimits.longestEdge / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context)
      throw new Error(
        'This browser could not prepare your photo. Try another browser.',
      );
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error('Could not prepare your photo.')),
        'image/png',
      ),
    );
    if (blob.size > photoLimits.bytes)
      throw new Error(
        'The prepared image is too large. Choose a smaller photo.',
      );
    return { blob, pixels, width: canvas.width, height: canvas.height };
  } finally {
    bitmap.close();
  }
}
