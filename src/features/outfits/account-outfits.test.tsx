import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, it, expect, vi } from 'vitest';
import { OutfitSuggestions } from './outfit-suggestions';
import { defaultGarment, type WardrobeItem } from '@/features/wardrobe/model';
import { toOutfitItems } from '@/features/wardrobe/outfit-items';
import { generateOutfits } from '@/lib/outfits/engine';

const state = vi.hoisted(() => ({
  items: [] as WardrobeItem[],
}));
vi.mock('@/features/account/runtime', () => ({
  useAccount: () => ({ enabled: true, userId: 'user_a' }),
}));
vi.mock('@/features/wardrobe/account-provider', () => ({
  useWardrobe: () => ({
    items: state.items,
    persistence: 'saved',
    mode: 'account',
    loaded: true,
    loadError: '',
  }),
}));
vi.mock('@/features/wardrobe/data-notice', () => ({
  WardrobeDataNotice: () => <p>Account sync</p>,
  WardrobeLoading: () => null,
  WardrobeUnavailable: () => null,
}));
vi.mock('@/features/wardrobe/garment-photo', () => ({
  GarmentPhoto: () => <span>Sample garment</span>,
}));
beforeEach(() => {
  state.items = [
    ...Array.from({ length: 8 }, () => defaultGarment('tshirt')),
    defaultGarment('jeans'),
    defaultGarment('sneakers'),
  ].map((x, i) => ({
    ...x,
    id: `22222222-2222-4222-8222-${String(i).padStart(12, '0')}`,
    revision: 1,
  }));
});
afterEach(() => vi.unstubAllGlobals());

it('appends the next account page, moves keyboard focus to new results and hides visitor prompts', async () => {
  const generated = generateOutfits({
    items: toOutfitItems(state.items),
    filters: { season: 'Any', formality: 'Any' },
    now: 0,
  });
  if (!generated.ok) throw new Error('Invalid fixture');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url, init) => {
      const { offset } = JSON.parse(init.body);
      return new Response(
        JSON.stringify({
          ...generated,
          ownerId: 'user_a',
          items: state.items,
          snapshot: 'a'.repeat(64),
          candidates: generated.candidates.slice(offset, offset + 6),
          nextOffset: Math.min(offset + 6, 8),
          moreAvailable: offset === 0,
        }),
      );
    }),
  );
  render(<OutfitSuggestions />);
  fireEvent.click(screen.getByRole('button', { name: 'Suggest outfits' }));
  await screen.findByRole('button', { name: 'Show more' });
  expect(document.querySelectorAll('.outfit-card')).toHaveLength(6);
  expect(
    screen.queryByRole('region', { name: 'Account benefits' }),
  ).not.toBeInTheDocument();
  const more = screen.getByRole('button', { name: 'Show more' });
  more.focus();
  fireEvent.click(more);
  await waitFor(() =>
    expect(document.querySelectorAll('.outfit-card')).toHaveLength(8),
  );
  expect(document.querySelectorAll('.outfit-card h2')[6]).toHaveFocus();
  expect(
    screen.queryByRole('button', { name: 'Show more' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: /Favorite|I wore this|Not for me/ }),
  ).not.toBeInTheDocument();
});
