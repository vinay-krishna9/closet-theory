import { it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { accountOutfitsOperation } from './account-operation';
import { defaultGarment } from '@/features/wardrobe/model';
import { toOutfitItems } from '@/features/wardrobe/outfit-items';
import { generateOutfits } from '@/lib/outfits/engine';
import type { AccountItem } from '@/features/wardrobe/account-contract';

const identity = {
  userId: 'user_a',
  verified: true,
  databaseVerified: true,
  getToken: async () => 'owner-token',
};
function clothes(tops: number): AccountItem[] {
  return [
    ...Array.from({ length: tops }, () => defaultGarment('tshirt')),
    defaultGarment('jeans'),
    defaultGarment('sneakers'),
  ].map((garment, index) => ({
    ...garment,
    revision: 1,
    id: `22222222-2222-4222-8222-${String(index).padStart(12, '0')}`,
  }));
}
const command = {
  expectedOwner: 'user_a',
  filters: { season: 'Any', formality: 'Any' },
  offset: 0,
  snapshot: null,
};
function request(change = {}, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/account/outfits', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify({ ...command, ...change }),
  });
}
function database(
  items = clothes(8),
  ownerId = 'user_a',
  error: unknown = null,
) {
  const rpc = vi.fn(() => ({
    retry: vi
      .fn()
      .mockResolvedValue({ data: { ownerId, items }, error, status: 200 }),
  }));
  const create = vi.fn(() => ({ rpc }) as unknown as SupabaseClient);
  return { rpc, create };
}
it.each([1, 6, 8, 10, 14])(
  'returns the best ten of %i matches in distinct deterministic pages',
  async (count) => {
    const items = clothes(count),
      db = database(items);
    const response = await accountOutfitsOperation(
      request(),
      identity,
      db.create,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const first = await response.json();
    expect(first.candidates).toHaveLength(Math.min(count, 6));
    expect(first.moreAvailable).toBe(count > 6);
    expect(db.create).toHaveBeenCalledWith('owner-token');
    expect(db.rpc).toHaveBeenCalledWith('list_wardrobe_items');
    const expected = generateOutfits({
      items: toOutfitItems(items),
      filters: { season: 'Any', formality: 'Any' },
      now: 0,
    });
    expect(expected.ok).toBe(true);
    if (!expected.ok) throw new Error('Invalid fixture');
    expect(first.candidates).toEqual(expected.candidates.slice(0, 6));
    const reordered = await (
      await accountOutfitsOperation(
        request({ filters: { formality: 'Any', season: 'Any' } }),
        identity,
        db.create,
      )
    ).json();
    expect(reordered.snapshot).toBe(first.snapshot);
    if (count > 6) {
      const second = await (
        await accountOutfitsOperation(
          request({ snapshot: first.snapshot, offset: first.nextOffset }),
          identity,
          db.create,
        )
      ).json();
      expect(second.candidates).toEqual(expected.candidates.slice(6, 10));
      expect(second.moreAvailable).toBe(false);
      expect(
        new Set([...first.candidates, ...second.candidates].map((x) => x.id))
          .size,
      ).toBe(Math.min(count, 10));
      expect(
        await (
          await accountOutfitsOperation(
            request({ snapshot: first.snapshot, offset: first.nextOffset }),
            identity,
            db.create,
          )
        ).json(),
      ).toEqual(second);
    }
  },
);
it('rejects changed wardrobe revisions, removals, filters and foreign-owner snapshots', async () => {
  const items = clothes(8);
  const first = await (
    await accountOutfitsOperation(request(), identity, database(items).create)
  ).json();
  for (const next of [
    [...items.slice(1)],
    items.map((x, i) => (i ? x : { ...x, revision: 2 })),
  ]) {
    const result = await accountOutfitsOperation(
      request({ snapshot: first.snapshot, offset: 6 }),
      identity,
      database(next).create,
    );
    expect(result.status).toBe(409);
    expect(await result.json()).toEqual({ code: 'outfit_snapshot_changed' });
  }
  expect(
    (
      await accountOutfitsOperation(
        request({
          snapshot: first.snapshot,
          offset: 6,
          filters: { season: 'Winter', formality: 'Any' },
        }),
        identity,
        database().create,
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await accountOutfitsOperation(
        request({
          expectedOwner: 'user_b',
          snapshot: first.snapshot,
          offset: 6,
        }),
        { ...identity, userId: 'user_b' },
        database(items, 'user_b').create,
      )
    ).status,
  ).toBe(409);
});
it('requires verified identity and origin before reading any private clothing', async () => {
  const db = database();
  expect(
    (await accountOutfitsOperation(request(), null, db.create)).status,
  ).toBe(401);
  expect(
    (
      await accountOutfitsOperation(
        request(),
        { ...identity, verified: false },
        db.create,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await accountOutfitsOperation(
        request(),
        { ...identity, databaseVerified: false },
        db.create,
      )
    ).status,
  ).toBe(503);
  expect(
    (
      await accountOutfitsOperation(
        request({}, 'https://foreign.example'),
        identity,
        db.create,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await accountOutfitsOperation(
        request({ expectedOwner: 'user_b' }),
        identity,
        db.create,
      )
    ).status,
  ).toBe(409);
  expect(db.create).not.toHaveBeenCalled();
});
it.each([
  { itemIds: ['foreign'] },
  { offset: -6 },
  { offset: 1 },
  { offset: 240 },
  { offset: 12, snapshot: 'a'.repeat(64) },
  { offset: 6 },
  { snapshot: 'forged' },
  { filters: { season: 'Tomorrow', formality: 'Any' } },
  { filters: { season: 'Any', formality: 'Any', owner: 'foreign' } },
])(
  'rejects invalid or client-supplied garment/paging input %j',
  async (change) => {
    const db = database();
    expect(
      (await accountOutfitsOperation(request(change), identity, db.create))
        .status,
    ).toBe(400);
    expect(db.create).not.toHaveBeenCalled();
  },
);
it('returns honest empty/filter outcomes and hides database failures', async () => {
  const empty = await (
    await accountOutfitsOperation(request(), identity, database([]).create)
  ).json();
  expect(empty.outcome).toBe('missing-groups');
  expect(empty.moreAvailable).toBe(false);
  const filtered = await (
    await accountOutfitsOperation(
      request({ filters: { season: 'Any', formality: 'Formal' } }),
      identity,
      database().create,
    )
  ).json();
  expect(filtered.outcome).toBe('filtered-groups');
  const foreign = await accountOutfitsOperation(
    request(),
    identity,
    database(clothes(8), 'user_b').create,
  );
  expect(foreign.status).toBe(502);
  const failure = await accountOutfitsOperation(
    request(),
    identity,
    database([], 'user_a', { code: 'PRIVATE', message: 'sensitive diagnostic' })
      .create,
  );
  expect(failure.status).toBe(502);
  expect(JSON.stringify(await failure.json())).not.toContain('sensitive');
});
