import {
  canonicalImportItems,
  operationIdPattern,
} from '@/features/account/import-payload';
import type { Garment, WardrobeItem } from './model';

export type AccountItem = WardrobeItem & { revision: number };
export function garmentFields(item: Garment): Garment {
  return {
    typeId: item.typeId,
    name: item.name,
    color: item.color,
    formality: item.formality,
    seasons: [...item.seasons],
    pattern: item.pattern,
    ...(item.neckline === undefined ? {} : { neckline: item.neckline }),
    ...(item.sleeves === undefined ? {} : { sleeves: item.sleeves }),
  };
}
export function accountItem(value: unknown): AccountItem {
  if (!value || typeof value !== 'object')
    throw new Error('Invalid account clothing');
  const raw = value as Record<string, unknown>;
  if (
    !Number.isInteger(raw.revision) ||
    (raw.revision as number) < 1 ||
    typeof raw.id !== 'string' ||
    !operationIdPattern.test(raw.id)
  )
    throw new Error('Invalid account clothing');
  const { revision, ...garment } = raw;
  return {
    ...canonicalImportItems([garment])[0],
    revision: revision as number,
  };
}
