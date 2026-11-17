import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OutfitFilters, OutfitRequest } from '@/lib/outfits/types';
import { generateOutfits } from '@/lib/outfits/engine';
import { defaultGarment, type WardrobeItem } from '@/features/wardrobe/model';
import { visitorResults, type VisitorResult } from './visitor-results';
import { useSuggestions } from './use-suggestions';

const jobs = vi.hoisted(
  () =>
    [] as {
      request: OutfitRequest;
      receive: (result: VisitorResult) => void;
      fail: () => void;
      cancel: ReturnType<typeof vi.fn>;
    }[],
);
vi.mock('./generation', () => ({
  startGeneration: (
    request: OutfitRequest,
    _id: number,
    receive: (result: VisitorResult) => void,
    fail: () => void,
  ) => {
    const job = { request, receive, fail, cancel: vi.fn() };
    jobs.push(job);
    return job.cancel;
  },
}));
const items: WardrobeItem[] = ['tshirt', 'jeans', 'sneakers'].map(
  (type, index) => ({
    ...defaultGarment(type as 'tshirt' | 'jeans' | 'sneakers'),
    id: `${index}`,
  }),
);
const filters: OutfitFilters = { season: 'Any', formality: 'Any' };
beforeEach(() => {
  jobs.length = 0;
});

describe('suggestion request snapshots', () => {
  it('waits for explicit submission, blocks rapid repeats and retries a failed request', () => {
    const { result } = renderHook(() => useSuggestions(items, filters));
    expect(jobs).toHaveLength(0);
    act(() => {
      result.current.suggest();
      result.current.suggest();
    });
    expect(jobs).toHaveLength(1);
    expect(result.current.status).toBe('pending');
    act(() => jobs[0].fail());
    expect(result.current.status).toBe('error');
    act(() => result.current.suggest());
    expect(jobs).toHaveLength(2);
    act(() =>
      jobs[1].receive(visitorResults(generateOutfits(jobs[1].request))),
    );
    expect(result.current.status).toBe('success');
    expect(
      result.current.result?.ok && result.current.result.candidates,
    ).toHaveLength(1);
  });
  it('invalidates changed filters, cancels old work and ignores stale responses', () => {
    const { result, rerender, unmount } = renderHook(
      (props) => useSuggestions(props.items, props.filters),
      { initialProps: { items, filters } },
    );
    act(() => result.current.suggest());
    rerender({ items, filters: { ...filters, season: 'Winter' } });
    expect(jobs[0].cancel).toHaveBeenCalledOnce();
    expect(result.current.status).toBe('ready');
    act(() => result.current.suggest());
    act(() =>
      jobs[0].receive(visitorResults(generateOutfits(jobs[0].request))),
    );
    expect(result.current.status).toBe('pending');
    act(() =>
      jobs[1].receive(visitorResults(generateOutfits(jobs[1].request))),
    );
    expect(result.current.status).toBe('success');
    act(() =>
      jobs[0].receive(visitorResults(generateOutfits(jobs[0].request))),
    );
    expect(result.current.status).toBe('success');
    unmount();
    expect(jobs[1].cancel).toHaveBeenCalledOnce();
  });
  it('invalidates edits/removal and can request explicit Any-filter recovery in the same interaction', () => {
    const { result, rerender } = renderHook(
      (props) => useSuggestions(props.items, props.filters),
      {
        initialProps: {
          items,
          filters: {
            ...filters,
            formality: 'Formal' as OutfitFilters['formality'],
          },
        },
      },
    );
    act(() => result.current.suggest());
    act(() =>
      jobs[0].receive(visitorResults(generateOutfits(jobs[0].request))),
    );
    rerender({ items: items.slice(1), filters });
    expect(result.current.status).toBe('ready');
    act(() => result.current.suggest(filters));
    act(() =>
      jobs[1].receive(visitorResults(generateOutfits(jobs[1].request))),
    );
    expect(result.current.result?.ok && result.current.result.outcome).toBe(
      'missing-groups',
    );
  });
});
