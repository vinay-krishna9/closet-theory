import { describe, expect, it } from 'vitest';
import { generateOutfits, getOutfitPage } from '@/lib/outfits/engine';
import type { OutfitItem } from '@/lib/outfits/types';
import { visitorResults } from './visitor-results';

describe('visitor outfit allowance', () => {
  it.each([0, 1, 2, 3, 4, 8])(
    'shows the actual visitor allowance with %i eligible tops',
    (count) => {
      const basic = {
        color: 'white',
        formality: 'Casual',
        seasons: ['Summer'],
        pattern: 'Solid',
        available: true,
      } as const;
      const items: OutfitItem[] = [
        ...Array.from({ length: count }, (_, index) => ({
          ...basic,
          id: `top-${index}`,
          group: 'Tops' as const,
        })),
        { ...basic, id: 'bottom', group: 'Bottoms' },
        { ...basic, id: 'shoes', group: 'Shoes' },
      ];
      const original = generateOutfits({
        items,
        filters: { season: 'Any', formality: 'Any' },
        now: 0,
      });
      if (!original.ok) throw new Error('Fixture must be valid');
      const result = visitorResults(original);
      if (!result.ok) throw new Error('Fixture must be valid');
      expect(result.candidates).toHaveLength(Math.min(count, 3));
      expect(result.moreAvailable).toBe(count > 3);
      expect(original.candidates).toHaveLength(count);
      expect(getOutfitPage(original.candidates).candidates).toHaveLength(
        Math.min(count, 6),
      );
      expect(visitorResults(original)).toEqual(result);
    },
  );
  it('preserves engine validation failures', () => {
    const error = {
      ok: false,
      error: { code: 'invalid-input', fields: ['now'] },
    } as const;
    expect(visitorResults(error)).toBe(error);
  });
});
