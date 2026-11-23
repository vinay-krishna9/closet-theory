import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { defaultGarment } from '@/features/wardrobe/model';
import {
  encodeWardrobe,
  visitorStorageKey,
  visitorImportStorageKey,
} from '@/features/wardrobe/visitor-storage';
import { acknowledgeImport, prepareImport } from './import-storage';

const shirt = { ...defaultGarment('tshirt'), id: 'shirt' };
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('navigator', {
    locks: {
      request: async (_name: string, callback: () => unknown) => callback(),
    },
  });
  localStorage.setItem(visitorStorageKey, encodeWardrobe([shirt]));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  localStorage.clear();
});
it('retains one operation through cancellation, verification and repeated prepares', async () => {
  const visitor = await prepareImport(null, [shirt]);
  expect(visitor?.ownerId).toBeNull();
  expect(await prepareImport(null, [shirt])).toEqual(visitor);
  const signedIn = await prepareImport('user_a', [shirt]);
  expect(signedIn?.operationId).toBe(visitor?.operationId);
  expect(signedIn?.ownerId).toBe('user_a');
  expect(await prepareImport('user_a', [shirt])).toEqual(signedIn);
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
});
it('clears only acknowledged unchanged selections, retaining edits and newly added clothes', async () => {
  const pending = (await prepareImport('user_a', [shirt]))!;
  const edited = { ...shirt, name: 'Edited during transfer' };
  const added = { ...defaultGarment('sneakers'), id: 'shoes' };
  localStorage.setItem(visitorStorageKey, encodeWardrobe([edited, added]));
  expect(await acknowledgeImport(pending, () => true)).toEqual({
    remaining: 2,
    changed: true,
  });
  expect(localStorage.getItem(visitorStorageKey)).toBe(
    encodeWardrobe([edited, added]),
  );
  expect(localStorage.getItem(visitorImportStorageKey)).toBeNull();
  const next = await prepareImport('user_a', [edited, added]);
  expect(next?.operationId).not.toBe(pending.operationId);
});
it('never acknowledges another owner or operation, or a cancelled request', async () => {
  const pending = (await prepareImport('user_a', [shirt]))!;
  await expect(prepareImport('user_b', [shirt])).rejects.toThrow(
    'import_account_changed',
  );
  await expect(acknowledgeImport(pending, () => false)).rejects.toThrow(
    'import_cancelled',
  );
  localStorage.setItem(
    visitorImportStorageKey,
    JSON.stringify({ ...pending, operationId: crypto.randomUUID() }),
  );
  await expect(acknowledgeImport(pending, () => true)).rejects.toThrow(
    'import_source_changed',
  );
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
});
it('keeps the original snapshot if source cleanup fails, so Retry reuses its identity', async () => {
  const pending = (await prepareImport('user_a', [shirt]))!;
  const remove = vi
    .spyOn(Storage.prototype, 'removeItem')
    .mockImplementationOnce(() => {
      throw new Error('Storage blocked');
    });
  await expect(acknowledgeImport(pending, () => true)).rejects.toThrow();
  remove.mockRestore();
  expect(await prepareImport('user_a', [shirt])).toEqual(pending);
  await acknowledgeImport(pending, () => true);
  expect(localStorage.getItem(visitorStorageKey)).toBeNull();
  expect(localStorage.getItem(visitorImportStorageKey)).toBeNull();
});
it('preserves corrupt records and rejects unsafe coordination instead of silently importing nothing', async () => {
  localStorage.setItem(visitorImportStorageKey, '{broken');
  await expect(prepareImport('user_a', [shirt])).rejects.toThrow();
  expect(localStorage.getItem(visitorImportStorageKey)).toBe('{broken');
  vi.stubGlobal('navigator', {});
  expect(() => prepareImport('user_a', [shirt])).toThrow(
    'import_storage_unavailable',
  );
  expect(localStorage.getItem(visitorStorageKey)).toBeTruthy();
});
