import type { CleanPhoto } from '@/lib/images/photo-browser';
export function removePhotoBackground(
  photo: CleanPhoto,
  success: (blob: Blob) => void,
  failure: () => void,
) {
  let worker: Worker | undefined,
    active = true;
  const cancel = () => {
    active = false;
    clearTimeout(timer);
    worker?.terminate();
  };
  const failed = () => {
    if (active) {
      cancel();
      failure();
    }
  };
  const timer = setTimeout(failed, 30000);
  try {
    worker = new Worker(new URL('./photo.worker.ts', import.meta.url));
    worker.onmessage = ({ data }) => {
      if (!active) return;
      if (
        !(data.blob instanceof Blob) ||
        data.error ||
        data.blob.type !== 'image/png' ||
        data.blob.size < 1
      ) {
        failed();
        return;
      }
      cancel();
      success(data.blob);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      failed();
    };
    worker.onmessageerror = failed;
    // Copy the source buffer: retries and Use original must retain it locally.
    const pixels = photo.pixels.slice().buffer;
    worker.postMessage({ pixels, width: photo.width, height: photo.height }, [
      pixels,
    ]);
  } catch {
    queueMicrotask(failed);
  }
  return cancel;
}
