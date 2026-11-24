import { afterEach, beforeEach, it, expect, vi } from 'vitest';
import { removePhotoBackground } from './photo-processing';

let worker: {
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  terminate: ReturnType<typeof vi.fn>;
  postMessage: ReturnType<typeof vi.fn>;
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('Worker', function WorkerStub() {
    worker = {
      onmessage: null,
      onerror: null,
      terminate: vi.fn(),
      postMessage: vi.fn(),
    };
    return worker;
  });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const photo = {
  blob: new Blob(['source'], { type: 'image/png' }),
  pixels: new Uint8ClampedArray([1, 2, 3, 255]),
  width: 1,
  height: 1,
};
it('retains the source for retry/fallback, accepts a PNG result and ignores late results after cancellation', () => {
  const success = vi.fn(),
    failure = vi.fn();
  const cancel = removePhotoBackground(photo, success, failure);
  expect(worker.postMessage.mock.calls[0][0].pixels).not.toBe(
    photo.pixels.buffer,
  );
  expect(photo.pixels[0]).toBe(1);
  const cutout = new Blob(['cutout'], { type: 'image/png' });
  worker.onmessage!({ data: { blob: cutout } });
  expect(success).toHaveBeenCalledWith(cutout);
  expect(worker.terminate).toHaveBeenCalledOnce();
  cancel();
  worker.onmessage!({ data: { blob: cutout } });
  expect(success).toHaveBeenCalledOnce();
  expect(failure).not.toHaveBeenCalled();
});
it('times out after 30 seconds, terminates processing and never reports a false successful cutout', () => {
  const success = vi.fn(),
    failure = vi.fn();
  removePhotoBackground(photo, success, failure);
  vi.advanceTimersByTime(29_999);
  expect(failure).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(failure).toHaveBeenCalledOnce();
  worker.onmessage!({
    data: { blob: new Blob(['late'], { type: 'image/png' }) },
  });
  expect(success).not.toHaveBeenCalled();
  expect(worker.terminate).toHaveBeenCalledOnce();
});
it('rejects a malformed worker response and an unsupported worker without leaking work', async () => {
  const fail = vi.fn();
  removePhotoBackground(photo, vi.fn(), fail);
  worker.onmessage!({ data: { blob: 'not a photo' } });
  expect(fail).toHaveBeenCalledOnce();
  vi.stubGlobal(
    'Worker',
    class {
      constructor() {
        throw new Error('unsupported');
      }
    },
  );
  removePhotoBackground(photo, vi.fn(), fail);
  await vi.runAllTimersAsync();
  expect(fail).toHaveBeenCalledTimes(2);
});
