import type { OutfitRequest } from '@/lib/outfits/types';
import type { GenerationResponse } from './outfit.worker';
import type { VisitorResult } from './visitor-results';

export const generationTimeout = 15_000;

export function startGeneration(
  request: OutfitRequest,
  id: number,
  onResult: (result: VisitorResult) => void,
  onFailure: () => void,
): () => void {
  let active = true;
  let worker: Worker | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  function cancel() {
    active = false;
    clearTimeout(timeout);
    worker?.terminate();
  }
  function fail() {
    if (!active) return;
    cancel();
    onFailure();
  }
  try {
    worker = new Worker(new URL('./outfit.worker.ts', import.meta.url));
    worker.onmessage = ({ data }: MessageEvent<GenerationResponse>) => {
      if (!active || data.id !== id) return;
      cancel();
      onResult(data.result);
    };
    worker.onerror = (event) => {
      event.preventDefault();
      fail();
    };
    worker.onmessageerror = fail;
    timeout = setTimeout(fail, generationTimeout);
    worker.postMessage({ id, request });
  } catch {
    queueMicrotask(fail);
  }
  return cancel;
}
