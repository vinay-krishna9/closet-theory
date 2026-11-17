import { describe, expect, it } from 'vitest';
import { catalog } from '@/features/onboarding/catalog';
import { generateOutfits } from '@/lib/outfits/engine';
import { defaultGarment } from './model';
import { toOutfitItems } from './outfit-items';
import { decodeWardrobe, encodeWardrobe } from './visitor-storage';

describe('wardrobe outfit adapter', () => {
  it('maps every existing garment type to its catalog group and copies the confirmed matching tags', () => {
    const wardrobe = catalog.map((type) => ({
      ...defaultGarment(type.id),
      id: type.id,
    }));
    const items = toOutfitItems(wardrobe);
    expect(items.map((item) => item.group)).toEqual(
      catalog.map((type) => type.group),
    );
    expect(items.map((item) => item.id)).toEqual(
      wardrobe.map((item) => item.id),
    );
    expect(items.every((item) => item.available)).toBe(true);
    expect(items[0].seasons).toEqual(wardrobe[0].seasons);
    expect(items[0].seasons).not.toBe(wardrobe[0].seasons);
    expect(items[0]).not.toHaveProperty('name');
    expect(items[0]).not.toHaveProperty('image');
  });
  it('generates outfits from restored version-1 selections with intentional duplicate configurations', () => {
    const wardrobe = ['tshirt', 'jeans', 'sneakers', 'tshirt'].map(
      (type, index) => ({
        ...defaultGarment(type as 'tshirt' | 'jeans' | 'sneakers'),
        id: `owned-${index}`,
      }),
    );
    const raw = encodeWardrobe(wardrobe);
    expect(JSON.parse(raw).version).toBe(1);
    const restored = decodeWardrobe(raw);
    const result = generateOutfits({
      items: toOutfitItems(restored),
      filters: { season: 'Any', formality: 'Any' },
      now: Date.UTC(2026, 10, 17),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.candidates).toHaveLength(2);
    expect(
      result.candidates.map((candidate) => candidate.slots.top).sort(),
    ).toEqual(['owned-0', 'owned-3']);
    expect(encodeWardrobe(restored)).toBe(raw);
  });
});
