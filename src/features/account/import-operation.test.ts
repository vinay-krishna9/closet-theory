import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultGarment } from '@/features/wardrobe/model';
import { importOperation } from './import-operation';
import { canonicalImportItems } from './import-payload';

const operationId = 'e7f9f51b-317d-4cbf-94bd-9f2f3f28a805';
const items = [{ ...defaultGarment('tshirt'), id: 'selection-1' }];
const identity = {
  userId: 'user_a',
  verified: true,
  databaseVerified: true,
  getToken: async () => 'signed-token',
};
const receipt = {
  operationId,
  ownerId: 'user_a',
  imported: 1,
  matched: 0,
  mappings: [{ selectionId: 'selection-1', itemId: operationId }],
};
function request(overrides = {}, origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/account/import', {
    method: 'POST',
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operationId,
      expectedOwner: 'user_a',
      timezone: 'UTC',
      items,
      ...overrides,
    }),
  });
}
function database(data: unknown = receipt, error: unknown = null) {
  const retry = vi
    .fn()
    .mockResolvedValue({ data, error, status: error ? 400 : 200 });
  const rpc = vi.fn(() => ({ retry }));
  return { rpc, create: () => ({ rpc }) as unknown as SupabaseClient };
}
it('derives ownership from verified identity and sends a canonical batch to one transaction', async () => {
  const db = database();
  const result = await importOperation(request(), identity, db.create);
  expect(result.status).toBe(200);
  expect(result.headers.get('cache-control')).toContain('no-store');
  expect(await result.json()).toEqual(receipt);
  expect(db.rpc).toHaveBeenCalledWith('import_visitor_wardrobe', {
    p_operation_id: operationId,
    p_timezone: 'UTC',
    p_items: canonicalImportItems(items),
  });
});
it('rejects anonymous, unverified, stale-owner and cross-origin operations before any database call', async () => {
  const db = database();
  expect((await importOperation(request(), null, db.create)).status).toBe(401);
  expect(
    (
      await importOperation(
        request(),
        { ...identity, verified: false },
        db.create,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await importOperation(
        request({ expectedOwner: 'user_b' }),
        identity,
        db.create,
      )
    ).status,
  ).toBe(409);
  expect(
    (
      await importOperation(
        request({}, 'https://other.example'),
        identity,
        db.create,
      )
    ).status,
  ).toBe(403);
  expect(db.rpc).not.toHaveBeenCalled();
});
it.each([
  { items: [items[0], items[0]] },
  { items: [{ ...items[0], neckline: undefined }] },
  { items: [{ ...items[0], color: 'pink' }] },
  { items: [{ ...items[0], owner_id: 'user_b' }] },
  { owner_id: 'user_b' },
  { operationId: 'unstable' },
  { timezone: 'not-a-timezone' },
])('rejects invalid or forged payloads without writes: %j', async (change) => {
  const db = database();
  expect(
    (await importOperation(request(change), identity, db.create)).status,
  ).toBe(400);
  expect(db.rpc).not.toHaveBeenCalled();
});
it('binds conflict recovery to the original operation and never acknowledges an incomplete mapping', async () => {
  const conflict = database(null, {
    code: 'P0001',
    message: 'import_payload_conflict',
  });
  expect(
    (await importOperation(request(), identity, conflict.create)).status,
  ).toBe(409);
  const incomplete = database({ ...receipt, mappings: [] });
  expect(
    (await importOperation(request(), identity, incomplete.create)).status,
  ).toBe(502);
  const foreign = database({ ...receipt, ownerId: 'user_b' });
  expect(
    (await importOperation(request(), identity, foreign.create)).status,
  ).toBe(502);
});
it('accepts an empty batch without inventing clothing, but reports missing setup honestly', async () => {
  const empty = database({ ...receipt, imported: 0, mappings: [] });
  expect(
    (await importOperation(request({ items: [] }), identity, empty.create))
      .status,
  ).toBe(200);
  const missing = database(null, { code: 'PGRST202' });
  const result = await importOperation(request(), identity, missing.create);
  expect(result.status).toBe(503);
  expect(await result.json()).toEqual({ code: 'import_setup_required' });
});
