import { catalog } from '@/features/onboarding/catalog';
import { validateGarment, type WardrobeItem } from './model';
export const visitorStorageKey = 'closet-theory.visitor-wardrobe';
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function decodeItem(value: unknown): WardrobeItem {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    !catalog.some((type) => type.id === value.typeId) ||
    typeof value.name !== 'string' ||
    typeof value.color !== 'string' ||
    typeof value.formality !== 'string' ||
    typeof value.pattern !== 'string' ||
    !Array.isArray(value.seasons) ||
    !value.seasons.every((s) => typeof s === 'string') ||
    (value.neckline !== undefined && typeof value.neckline !== 'string') ||
    (value.sleeves !== undefined && typeof value.sleeves !== 'string')
  )
    throw new Error('Invalid saved garment');
  const item = {
    id: value.id,
    typeId: value.typeId,
    name: value.name,
    color: value.color,
    formality: value.formality,
    seasons: [...value.seasons],
    pattern: value.pattern,
    ...(value.neckline === undefined ? {} : { neckline: value.neckline }),
    ...(value.sleeves === undefined ? {} : { sleeves: value.sleeves }),
  } as WardrobeItem;
  if (validateGarment(item).length) throw new Error('Invalid saved garment');
  return item;
}
export function decodeWardrobe(raw: string | null): readonly WardrobeItem[] {
  if (raw === null) return [];
  const payload: unknown = JSON.parse(raw);
  if (!record(payload)) throw new Error('Invalid saved wardrobe');
  // First shipped schema. Add fixture-backed migrations here when a schema changes.
  switch (payload.version) {
    case 1: {
      if (!Array.isArray(payload.items))
        throw new Error('Invalid saved wardrobe');
      const items = payload.items.map(decodeItem);
      if (new Set(items.map((item) => item.id)).size !== items.length)
        throw new Error('Duplicate saved identity');
      return items;
    }
    default:
      throw new Error('Unsupported saved wardrobe version');
  }
}
export function encodeWardrobe(items: readonly WardrobeItem[]) {
  return JSON.stringify({ version: 1, items: items.map(decodeItem) });
}
export function readWardrobe() {
  return readWardrobeSnapshot().items;
}
export function readWardrobeSnapshot() {
  const raw = window.localStorage.getItem(visitorStorageKey);
  return { raw, items: decodeWardrobe(raw) };
}
export function writeWardrobe(items: readonly WardrobeItem[]) {
  const raw = encodeWardrobe(items);
  window.localStorage.setItem(visitorStorageKey, raw);
  return raw;
}
export function removeWardrobe() {
  window.localStorage.removeItem(visitorStorageKey);
}
