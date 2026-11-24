import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { useAccountSuggestions } from './use-account-suggestions';
import { defaultGarment } from '@/features/wardrobe/model';
import { toOutfitItems } from '@/features/wardrobe/outfit-items';
import { generateOutfits } from '@/lib/outfits/engine';
import type { OutfitFilters } from '@/lib/outfits/types';

const items = [
  ...Array.from({ length: 8 }, () => defaultGarment('tshirt')),
  defaultGarment('jeans'),
  defaultGarment('sneakers'),
].map((x, i) => ({
  ...x,
  revision: 1,
  id: `22222222-2222-4222-8222-${String(i).padStart(12, '0')}`,
}));
const filters: OutfitFilters = { season: 'Any', formality: 'Any' };
const generated = generateOutfits({
  items: toOutfitItems(items),
  filters,
  now: 0,
});
if (!generated.ok) throw new Error('Invalid fixture');
const page = (offset = 0, ownerId = 'user_a') => ({
  ...generated,
  ownerId,
  items,
  snapshot: 'a'.repeat(64),
  candidates: generated.candidates.slice(offset, offset + 6),
  nextOffset: Math.min(offset + 6, 8),
  moreAvailable: offset === 0,
});
const reply = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status });
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

it('blocks rapid submits, appends distinct pages and retries the same failed page without losing results', async () => {
  const calls: Record<string, unknown>[] = [];
  let fail = true;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.offset === 6 && fail)
        return reply({ code: 'suggestions_unavailable' }, 503);
      return reply(page(body.offset));
    }),
  );
  const { result } = renderHook(() =>
    useAccountSuggestions(items, filters, 'user_a'),
  );
  act(() => {
    result.current.suggest();
    result.current.suggest();
  });
  await waitFor(() =>
    expect(result.current.result?.candidates).toHaveLength(6),
  );
  expect(calls).toHaveLength(1);
  act(() => result.current.showMore());
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.result?.candidates).toHaveLength(6);
  expect(result.current.retryMore).toBe(true);
  fail = false;
  act(() => {
    result.current.showMore();
    result.current.showMore();
  });
  await waitFor(() =>
    expect(result.current.result?.candidates).toHaveLength(8),
  );
  expect(calls[2]).toEqual(calls[1]);
  expect(new Set(result.current.result?.candidates.map((x) => x.id)).size).toBe(
    8,
  );
  expect(result.current.result?.moreAvailable).toBe(false);
  expect(localStorage.length).toBe(0);
});

it('cancels filter changes and ignores late responses even when transport ignores abort', async () => {
  let resolve!: (value: Response) => void;
  let signal!: AbortSignal;
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      signal = init.signal;
      return new Promise<Response>((r) => {
        resolve = r;
      });
    }),
  );
  const { result, rerender } = renderHook(
    ({ selected }) => useAccountSuggestions(items, selected, 'user_a'),
    { initialProps: { selected: filters } },
  );
  act(() => result.current.suggest());
  rerender({ selected: { ...filters, season: 'Winter' } });
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(reply(page())));
  expect(result.current.result).toBeNull();
  expect(result.current.status).toBe('ready');
  rerender({ selected: filters });
  expect(result.current.result).toBeNull();
});

it('clears completed results on wardrobe or owner changes and never revives a previous snapshot', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => reply(page())),
  );
  const { result, rerender } = renderHook(
    ({ clothing, owner }) => useAccountSuggestions(clothing, filters, owner),
    { initialProps: { clothing: items, owner: 'user_a' } },
  );
  act(() => result.current.suggest());
  await waitFor(() =>
    expect(result.current.result?.candidates).toHaveLength(6),
  );
  rerender({ clothing: items.slice(1), owner: 'user_a' });
  expect(result.current.result).toBeNull();
  rerender({ clothing: items, owner: 'user_a' });
  expect(result.current.result).toBeNull();
  rerender({ clothing: items, owner: 'user_b' });
  act(() => result.current.suggest());
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.result).toBeNull();
});

it('discards stale paging and requires regeneration instead of showing previous outfits', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) =>
      JSON.parse(init.body).offset
        ? reply({ code: 'outfit_snapshot_changed' }, 409)
        : reply(page()),
    ),
  );
  const { result } = renderHook(() =>
    useAccountSuggestions(items, filters, 'user_a'),
  );
  act(() => result.current.suggest());
  await waitFor(() =>
    expect(result.current.result?.candidates).toHaveLength(6),
  );
  act(() => result.current.showMore());
  await waitFor(() => expect(result.current.status).toBe('error'));
  expect(result.current.result).toBeNull();
  expect(result.current.retryMore).toBe(false);
  expect(result.current.error).toContain('wardrobe changed');
});

it('supports Try Any submission in the same interaction and cancels on unmount', async () => {
  let finish!: (value: Response) => void;
  let signal!: AbortSignal;
  vi.stubGlobal(
    'fetch',
    vi.fn((_url, init) => {
      signal = init.signal;
      return new Promise<Response>((r) => {
        finish = r;
      });
    }),
  );
  const formal: OutfitFilters = { season: 'Any', formality: 'Formal' };
  const { result, rerender, unmount } = renderHook(
    ({ selected }) => useAccountSuggestions(items, selected, 'user_a'),
    { initialProps: { selected: formal } },
  );
  act(() => result.current.suggest(filters));
  rerender({ selected: filters });
  expect(signal.aborted).toBe(false);
  await act(async () => finish(reply(page())));
  expect(result.current.result?.candidates).toHaveLength(6);
  act(() => result.current.showMore());
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => finish(reply(page(6))));
});
