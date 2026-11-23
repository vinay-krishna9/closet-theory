import { decodeWardrobe } from '@/features/wardrobe/visitor-storage';
import { seasons } from '@/features/onboarding/catalog';
import type { WardrobeItem } from '@/features/wardrobe/model';

export const importLimit = 2000;
export const operationIdPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const fields = new Set([
  'id',
  'typeId',
  'name',
  'color',
  'formality',
  'seasons',
  'pattern',
  'neckline',
  'sleeves',
]);

export function canonicalImportItems(value: unknown): WardrobeItem[] {
  if (
    !Array.isArray(value) ||
    value.length > importLimit ||
    value.some(
      (item) =>
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item) ||
        Object.keys(item).some((key) => !fields.has(key)),
    )
  )
    throw new Error('Invalid import');
  const items = decodeWardrobe(JSON.stringify({ version: 1, items: value }));
  if (items.some((item) => item.id.length > 200))
    throw new Error('Invalid selection identity');
  return items
    .map((item) => ({
      ...item,
      name: item.name.trim(),
      seasons: seasons.filter((season) => item.seasons.includes(season)),
    }))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

export type ImportReceipt = {
  operationId: string;
  ownerId: string;
  imported: number;
  matched: number;
  mappings: { selectionId: string; itemId: string }[];
};

export function validReceipt(
  value: unknown,
  ownerId: string,
  operationId: string,
  items: readonly WardrobeItem[],
): value is ImportReceipt {
  if (!value || typeof value !== 'object') return false;
  const result = value as ImportReceipt;
  return (
    result.ownerId === ownerId &&
    result.operationId === operationId &&
    Number.isInteger(result.imported) &&
    result.imported >= 0 &&
    Number.isInteger(result.matched) &&
    result.matched >= 0 &&
    result.imported + result.matched === items.length &&
    Array.isArray(result.mappings) &&
    result.mappings.length === items.length &&
    new Set(result.mappings.map((mapping) => mapping?.selectionId)).size ===
      items.length &&
    new Set(result.mappings.map((mapping) => mapping?.itemId)).size ===
      items.length &&
    result.mappings.every(
      (mapping) =>
        mapping &&
        items.some((item) => item.id === mapping.selectionId) &&
        typeof mapping.itemId === 'string' &&
        operationIdPattern.test(mapping.itemId),
    )
  );
}
