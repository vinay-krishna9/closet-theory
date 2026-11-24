import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultGarment } from './model';
import { wardrobeOperation } from './account-operation';
const id = '22222222-2222-4222-8222-222222222222';
const identity = {
  userId: 'user_a',
  verified: true,
  databaseVerified: true,
  getToken: async () => 'fixture',
};
const body = {
  operationId: id,
  expectedOwner: 'user_a',
  timezone: 'UTC',
  action: 'add',
  item: { ...defaultGarment('tshirt'), id },
  expectedRevision: null,
  separate: false,
};
function request(change = {}, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/account/wardrobe', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, ...change }),
  });
}
function db(
  error: unknown = null,
  data: unknown = {
    ownerId: 'user_a',
    operationId: id,
    itemId: id,
    matched: false,
  },
) {
  const rpc = vi.fn(() => ({
    retry: vi.fn().mockResolvedValue({ error, data, status: 200 }),
  }));
  return { rpc, create: () => ({ rpc }) as unknown as SupabaseClient };
}
it('uses one token-scoped transaction and acknowledges only an owner-bound operation result', async () => {
  const database = db();
  const result = await wardrobeOperation(request(), identity, database.create);
  expect(result.status).toBe(200);
  expect(result.headers.get('cache-control')).toContain('no-store');
  expect(database.rpc).toHaveBeenCalledWith(
    'mutate_wardrobe_item',
    expect.objectContaining({
      p_operation_id: id,
      p_action: 'add',
      p_item: body.item,
    }),
  );
  expect(
    (
      await wardrobeOperation(
        request(),
        identity,
        db(null, { ownerId: 'user_b' }).create,
      )
    ).status,
  ).toBe(502);
});
it('rejects unsigned, unverified, stale-owner and cross-origin requests without invoking persistence', async () => {
  const database = db();
  expect(
    (await wardrobeOperation(request(), null, database.create)).status,
  ).toBe(401);
  expect(
    (
      await wardrobeOperation(
        request(),
        { ...identity, verified: false },
        database.create,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await wardrobeOperation(
        request({ expectedOwner: 'user_b' }),
        identity,
        database.create,
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await wardrobeOperation(
        request({}, 'https://other.example'),
        identity,
        database.create,
      )
    ).status,
  ).toBe(403);
  expect(database.rpc).not.toHaveBeenCalled();
});
it.each([
  { action: 'update', expectedRevision: null },
  { item: { ...body.item, color: 'pink' } },
  { item: { ...body.item, owner_id: 'user_b' } },
  { action: 'remove', item: { id, name: 'forged' }, expectedRevision: 1 },
  { operationId: [id] },
])('rejects invalid mutation %j', async (change) => {
  const database = db();
  expect(
    (await wardrobeOperation(request(change), identity, database.create))
      .status,
  ).toBe(400);
  expect(database.rpc).not.toHaveBeenCalled();
});
it('reports setup and version conflicts without relaying private database diagnostics', async () => {
  expect(
    (
      await wardrobeOperation(
        request(),
        identity,
        db({ code: 'PGRST202' }).create,
      )
    ).status,
  ).toBe(503);
  const changed = await wardrobeOperation(
    request(),
    identity,
    db({ code: 'P0001', message: 'wardrobe_changed' }).create,
  );
  expect(changed.status).toBe(409);
  expect(await changed.json()).toEqual({ code: 'wardrobe_changed' });
  const unknown = await wardrobeOperation(
    request(),
    identity,
    db({ code: 'P0001', message: 'private internal value' }).create,
  );
  expect(await unknown.json()).toEqual({ code: 'wardrobe_unavailable' });
});
it('loads an owner-bound active list and rejects foreign or malformed responses', async () => {
  const request = new Request('http://localhost:3000/api/account/wardrobe');
  const database = db(null, {
    ownerId: 'user_a',
    items: [{ ...body.item, revision: 1 }],
  });
  const response = await wardrobeOperation(request, identity, database.create);
  expect(response.status).toBe(200);
  expect(database.rpc).toHaveBeenCalledWith('list_wardrobe_items');
  expect((await response.json()).items).toHaveLength(1);
  expect(
    (
      await wardrobeOperation(
        request,
        identity,
        db(null, { ownerId: 'user_b', items: [] }).create,
      )
    ).status,
  ).toBe(502);
  expect(
    (
      await wardrobeOperation(
        request,
        identity,
        db(null, { ownerId: 'user_a', items: [{ ...body.item, revision: 0 }] })
          .create,
      )
    ).status,
  ).toBe(503);
});
