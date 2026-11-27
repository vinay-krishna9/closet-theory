import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { usePhotoReview } from './use-photo-review';
import type { CleanPhoto } from '@/lib/images/photo-browser';
const mocks = vi.hoisted(() => ({
  clean: vi.fn(),
  jobs: [] as {
    success: (blob: Blob) => void;
    failure: () => void;
    cancel: ReturnType<typeof vi.fn>;
  }[],
}));
vi.mock('@/lib/images/photo-browser', () => ({ cleanPhoto: mocks.clean }));
vi.mock('./photo-processing', () => ({
  removePhotoBackground: (
    _photo: unknown,
    success: (blob: Blob) => void,
    failure: () => void,
  ) => {
    const job = { success, failure, cancel: vi.fn() };
    mocks.jobs.push(job);
    return job.cancel;
  },
}));
const source = (label: string): CleanPhoto => ({
  blob: new Blob([label], { type: 'image/png' }),
  pixels: new Uint8ClampedArray([10, 20, 30, 255]),
  width: 1,
  height: 1,
});
beforeEach(() => {
  mocks.clean.mockReset();
  mocks.jobs.length = 0;
  let id = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:fixture-${id++}`,
  );
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());
it('ignores out-of-order decode and worker results across replacement and explicit fallback', async () => {
  let first!: (photo: CleanPhoto) => void;
  const second = source('second');
  mocks.clean
    .mockImplementationOnce(
      () =>
        new Promise<CleanPhoto>((r) => {
          first = r;
        }),
    )
    .mockResolvedValue(second);
  const { result } = renderHook(usePhotoReview);
  act(() => {
    void result.current.choose(new File(['a'], 'a.png'));
  });
  await act(async () => result.current.choose(new File(['b'], 'b.png')));
  expect(result.current.source).toBe(second);
  await act(async () => first(source('first')));
  expect(mocks.jobs).toHaveLength(1);
  expect(result.current.source).toBe(second);
  act(() => result.current.select('original'));
  act(() =>
    mocks.jobs[0].success(new Blob(['late cutout'], { type: 'image/png' })),
  );
  expect(result.current.choice).toBe('original');
  expect(result.current.cutout).toBeNull();
  expect(mocks.jobs[0].cancel).toHaveBeenCalled();
});
it('keeps the sanitized original after errors, supports retries and releases previews on reset', async () => {
  mocks.clean.mockResolvedValue(source('safe'));
  const { result } = renderHook(usePhotoReview);
  await act(async () => result.current.choose(new File(['a'], 'a.png')));
  act(() => mocks.jobs[0].failure());
  expect(result.current.status).toBe('error');
  expect(result.current.selected).toBeNull();
  act(() => result.current.retry());
  act(() => mocks.jobs[1].success(new Blob(['cutout'], { type: 'image/png' })));
  expect(result.current.choice).toBe('cutout');
  expect(result.current.source).not.toBeNull();
  act(() => result.current.reset());
  expect(result.current.source).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2);
});
it('retains the last usable original on invalid reselection and does not leak an unmounted decode', async () => {
  mocks.clean
    .mockResolvedValueOnce(source('safe'))
    .mockRejectedValueOnce(new Error('Invalid photo'));
  const { result, unmount } = renderHook(usePhotoReview);
  await act(async () => result.current.choose(new File(['a'], 'a.png')));
  await act(async () => result.current.choose(new File(['b'], 'b.png')));
  expect(result.current.source).not.toBeNull();
  expect(result.current.error).toBe('Invalid photo');
  act(() => result.current.select('original'));
  expect(result.current.selected).not.toBeNull();
  unmount();
  expect(URL.revokeObjectURL).toHaveBeenCalled();
  let finish!: (photo: CleanPhoto) => void;
  mocks.clean.mockImplementation(
    () =>
      new Promise<CleanPhoto>((r) => {
        finish = r;
      }),
  );
  const late = renderHook(usePhotoReview);
  act(() => {
    void late.result.current.choose(new File(['c'], 'c.png'));
  });
  late.unmount();
  const count = mocks.jobs.length;
  await act(async () => finish(source('late')));
  await waitFor(() => expect(mocks.jobs).toHaveLength(count));
});
