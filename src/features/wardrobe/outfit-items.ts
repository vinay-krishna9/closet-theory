import { getType } from '@/features/onboarding/catalog';
import type { OutfitItem } from '@/lib/outfits/types';
import type { WardrobeItem } from './model';

export function toOutfitItems(items: readonly WardrobeItem[]): OutfitItem[] {
  return items.map((item) => ({
    id: item.id,
    group: getType(item.typeId).group,
    color: item.color,
    formality: item.formality,
    seasons: [...item.seasons],
    pattern: item.pattern,
    available: true,
  }));
}
