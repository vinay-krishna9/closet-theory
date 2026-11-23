import { canonicalImportItems, operationIdPattern } from './import-payload';
import type { WardrobeItem } from '@/features/wardrobe/model';
import {
  decodeWardrobe,
  encodeWardrobe,
  visitorStorageKey,
  visitorImportStorageKey,
} from '@/features/wardrobe/visitor-storage';
import { withVisitorLock } from '@/features/wardrobe/visitor-lock';

export type PendingImport = {
  version: 1;
  operationId: string;
  ownerId: string | null;
  timezone: string;
  items: WardrobeItem[];
};
function sameItems(a: readonly WardrobeItem[], b: readonly WardrobeItem[]) {
  return (
    JSON.stringify(canonicalImportItems(a)) ===
    JSON.stringify(canonicalImportItems(b))
  );
}
function readPending(): PendingImport | null {
  const raw = localStorage.getItem(visitorImportStorageKey);
  if (raw === null) return null;
  try {
    const value = JSON.parse(raw);
    if (
      !value ||
      value.version !== 1 ||
      !operationIdPattern.test(value.operationId) ||
      (value.ownerId !== null &&
        (typeof value.ownerId !== 'string' ||
          !value.ownerId.startsWith('user_'))) ||
      typeof value.timezone !== 'string' ||
      value.timezone.length > 100
    )
      throw new Error('import_storage_unreadable');
    new Intl.DateTimeFormat('en', { timeZone: value.timezone });
    return {
      version: 1,
      operationId: value.operationId,
      ownerId: value.ownerId,
      timezone: value.timezone,
      items: canonicalImportItems(value.items),
    };
  } catch {
    throw new Error('import_storage_unreadable');
  }
}
function requireCoordination() {
  if (!navigator.locks) throw new Error('import_storage_unavailable');
}
export function prepareImport(
  ownerId: string | null,
  currentItems: readonly WardrobeItem[],
  active: () => boolean = () => true,
) {
  requireCoordination();
  return withVisitorLock(() => {
    if (!active()) throw new Error('import_cancelled');
    const items = canonicalImportItems(
      decodeWardrobe(localStorage.getItem(visitorStorageKey)),
    );
    // Do not mistake unsaved, corrupt or conflicting source for an empty wardrobe.
    if (!sameItems(items, currentItems))
      throw new Error('import_source_changed');
    let pending = readPending();
    if (pending?.ownerId && ownerId && pending.ownerId !== ownerId)
      throw new Error('import_account_changed');
    if (
      !pending ||
      (pending.ownerId === null && !sameItems(pending.items, items))
    ) {
      if (!items.length) return null;
      pending = {
        version: 1,
        operationId: crypto.randomUUID(),
        ownerId: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        items,
      };
    }
    if (ownerId && pending.ownerId === null) pending.ownerId = ownerId;
    localStorage.setItem(visitorImportStorageKey, JSON.stringify(pending));
    return pending;
  });
}
export function acknowledgeImport(
  pending: PendingImport,
  active: () => boolean,
) {
  requireCoordination();
  return withVisitorLock(() => {
    if (!active()) throw new Error('import_cancelled');
    const latest = readPending();
    const current = decodeWardrobe(localStorage.getItem(visitorStorageKey));
    if (!latest)
      return { remaining: current.length, changed: current.length > 0 };
    if (
      latest.operationId !== pending.operationId ||
      latest.ownerId !== pending.ownerId ||
      !sameItems(latest.items, pending.items)
    )
      throw new Error('import_source_changed');
    const remaining = current.filter(
      (item) =>
        !pending.items.some(
          (saved) => saved.id === item.id && sameItems([saved], [item]),
        ),
    );
    if (remaining.length)
      localStorage.setItem(visitorStorageKey, encodeWardrobe(remaining));
    else localStorage.removeItem(visitorStorageKey);
    // Only remove the snapshot after source cleanup succeeds. A lost cleanup
    // response can replay the same transaction and receipt safely.
    localStorage.removeItem(visitorImportStorageKey);
    return { remaining: remaining.length, changed: remaining.length > 0 };
  });
}
export function clearPendingImport() {
  try {
    localStorage.removeItem(visitorImportStorageKey);
  } catch {
    /* Retain in-memory use. */
  }
}

export function restartImport(ownerId: string | null, active: () => boolean) {
  requireCoordination();
  return withVisitorLock(() => {
    if (!ownerId || !active()) throw new Error('import_cancelled');
    const pending = readPending();
    if (pending?.ownerId !== ownerId) throw new Error('import_account_changed');
    // Explicit conflict recovery retains the source and existing account data.
    canonicalImportItems(
      decodeWardrobe(localStorage.getItem(visitorStorageKey)),
    );
    localStorage.removeItem(visitorImportStorageKey);
  });
}
