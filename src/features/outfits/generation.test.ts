import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateOutfits } from '@/lib/outfits/engine';
import { generationTimeout, startGeneration } from './generation';
import type { GenerationResponse } from './outfit.worker';
import { visitorResults } from './visitor-results';

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<GenerationResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    TestWorker.instances.push(this);
  }
}
const request = {
  items: [],
  filters: { season: 'Any', formality: 'Any' },
  now: 0,
} as const;
const result = visitorResults(generateOutfits(request));
beforeEach(() => {
  TestWorker.instances = [];
  vi.stubGlobal('Worker', TestWorker);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('worker generation lifecycle', () => {
  it('sends the explicit request and accepts only its matching response', () => {
    const receive = vi.fn(),
      fail = vi.fn();
    startGeneration(request, 7, receive, fail);
    const worker = TestWorker.instances[0];
    expect(worker.postMessage).toHaveBeenCalledWith({ id: 7, request });
    worker.onmessage?.({
      data: { id: 6, result },
    } as MessageEvent<GenerationResponse>);
    expect(receive).not.toHaveBeenCalled();
    worker.onmessage?.({
      data: { id: 7, result },
    } as MessageEvent<GenerationResponse>);
    expect(receive).toHaveBeenCalledExactlyOnceWith(result);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(fail).not.toHaveBeenCalled();
  });
  it('cancels pending work and ignores late completions', () => {
    const receive = vi.fn(),
      fail = vi.fn();
    const cancel = startGeneration(request, 1, receive, fail);
    cancel();
    const worker = TestWorker.instances[0];
    worker.onmessage?.({
      data: { id: 1, result },
    } as MessageEvent<GenerationResponse>);
    worker.onmessageerror?.();
    expect(receive).not.toHaveBeenCalled();
    expect(fail).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('cleans up runtime and message failures once', () => {
    const fail = vi.fn();
    startGeneration(request, 1, vi.fn(), fail);
    const worker = TestWorker.instances[0];
    const event = new ErrorEvent('error', { cancelable: true });
    worker.onerror?.(event);
    worker.onmessageerror?.();
    expect(event.defaultPrevented).toBe(true);
    expect(fail).toHaveBeenCalledOnce();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it('times out a stalled worker and clears the timer on successful completion', () => {
    vi.useFakeTimers();
    const fail = vi.fn();
    startGeneration(request, 1, vi.fn(), fail);
    vi.advanceTimersByTime(generationTimeout);
    expect(fail).toHaveBeenCalledOnce();
    const receive = vi.fn();
    startGeneration(request, 2, receive, fail);
    TestWorker.instances[1].onmessage?.({
      data: { id: 2, result },
    } as MessageEvent<GenerationResponse>);
    vi.advanceTimersByTime(generationTimeout);
    expect(receive).toHaveBeenCalledOnce();
    expect(fail).toHaveBeenCalledOnce();
  });
  it('reports worker startup failure asynchronously and permits cancellation before reporting', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('Unavailable');
        }
      },
    );
    const fail = vi.fn();
    startGeneration(request, 1, vi.fn(), fail);
    await Promise.resolve();
    expect(fail).toHaveBeenCalledOnce();
    const cancel = startGeneration(request, 2, vi.fn(), fail);
    cancel();
    await Promise.resolve();
    expect(fail).toHaveBeenCalledOnce();
  });
});
