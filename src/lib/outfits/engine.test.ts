import { describe, expect, it } from 'vitest';
import { generateOutfits, getOutfitPage } from './engine';
import { outfitIdentity } from './identity';
import type { OutfitItem, OutfitRequest, OutfitResult } from './types';

const now = Date.UTC(2026, 10, 17, 12);
const allSeasons = ['Spring', 'Summer', 'Autumn', 'Winter'] as const;
function item(
  id: string,
  group: OutfitItem['group'],
  changes: Partial<OutfitItem> = {},
): OutfitItem {
  return {
    id,
    group,
    color: 'white',
    formality: 'Casual',
    seasons: allSeasons,
    pattern: 'Solid',
    available: true,
    ...changes,
  };
}
const basics = [
  item('top', 'Tops'),
  item('bottom', 'Bottoms', { color: 'indigo' }),
  item('shoes', 'Shoes'),
];
function run(
  items: readonly OutfitItem[] = basics,
  changes: Partial<OutfitRequest> = {},
) {
  const result = generateOutfits({
    items,
    now,
    filters: { season: 'Any', formality: 'Any' },
    ...changes,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('Expected valid request');
  return result;
}
function ids(result: Extract<OutfitResult, { ok: true }>) {
  return result.candidates.map((candidate) => candidate.id);
}

describe('outfit identity and deterministic requests', () => {
  it('uses sorted IDs with unambiguous serialization', () => {
    expect(outfitIdentity(['b', 'a'])).toBe(outfitIdentity(['a', 'b']));
    expect(outfitIdentity(['a,b', 'c'])).not.toBe(outfitIdentity(['a', 'b,c']));
    expect(outfitIdentity(['a', 'b', 'c', 'jacket'])).not.toBe(
      outfitIdentity(['a', 'b', 'c']),
    );
  });
  it('returns owned IDs, truthful reasons and no public scores', () => {
    const candidate = run().candidates[0];
    expect(candidate.slots).toEqual({
      top: 'top',
      bottom: 'bottom',
      shoes: 'shoes',
    });
    expect(candidate.id).toBe(outfitIdentity(['top', 'bottom', 'shoes']));
    expect(candidate.preference).toBe('neutral');
    expect(candidate.reasons.map((reason) => reason.code)).toEqual([
      'exact-formality',
      'coordinated-colors',
    ]);
    expect(candidate).not.toHaveProperty('style');
    expect(candidate).not.toHaveProperty('score');
    expect(candidate).not.toHaveProperty('freshness');
  });
  it('is independent of input order, image/tint/display fields and repeat calls', () => {
    const wardrobe = [
      ...basics,
      item('another', 'Tops', { color: 'navy' }),
      item('trousers', 'Bottoms', { color: 'beige' }),
    ];
    const original = run(wardrobe);
    expect(run([...wardrobe].reverse())).toEqual(original);
    expect(
      run(
        wardrobe.map((garment) => ({
          ...garment,
          name: 'Updated',
          image: '/different.png',
          tint: '#ff0000',
        })),
      ),
    ).toEqual(original);
    expect(run(wardrobe)).toEqual(original);
  });
  it('preserves intentionally separate garments with identical tags and does not mutate inputs', () => {
    const wardrobe = [...basics, item('second-top', 'Tops')];
    const before = JSON.stringify(wardrobe);
    wardrobe.forEach((garment) => Object.freeze(garment));
    Object.freeze(wardrobe);
    expect(run(wardrobe).candidates).toHaveLength(2);
    expect(JSON.stringify(wardrobe)).toBe(before);
  });
});

describe('eligibility and recovery diagnostics', () => {
  it('reports all required groups for an empty wardrobe', () => {
    const result = run([]);
    expect(result.outcome).toBe('missing-groups');
    expect(result.diagnostics.missingGroups).toEqual([
      'Tops',
      'Bottoms',
      'Shoes',
    ]);
    expect(result.candidates).toEqual([]);
  });
  it.each(['Tops', 'Bottoms', 'Shoes'] as const)(
    'reports a missing %s group',
    (group) => {
      expect(
        run(basics.filter((garment) => garment.group !== group)).diagnostics
          .missingGroups,
      ).toEqual([group]);
    },
  );
  it('excludes unavailable clothes before checking completeness or preferences', () => {
    const wardrobe = basics.map((garment) => ({
      ...garment,
      available: garment.group !== 'Shoes',
    }));
    const preferences = {
      [outfitIdentity(basics.map((garment) => garment.id))]:
        'favorite' as const,
    };
    const result = run(wardrobe, { preferences });
    expect(result.outcome).toBe('missing-groups');
    expect(result.diagnostics.missingGroups).toEqual(['Shoes']);
    expect(result.candidates).toEqual([]);
  });
  it('distinguishes season-filtered groups from an incomplete wardrobe', () => {
    const wardrobe = basics.map((garment) =>
      garment.group === 'Tops'
        ? { ...garment, seasons: ['Summer'] as const }
        : garment,
    );
    const result = run(wardrobe, {
      filters: { season: 'Winter', formality: 'Any' },
    });
    expect(result.outcome).toBe('filtered-groups');
    expect(result.diagnostics.missingGroups).toEqual([]);
    expect(result.diagnostics.filteredMissingGroups).toEqual(['Tops']);
    expect(run(wardrobe).candidates).toHaveLength(1);
  });
  it.each(allSeasons)(
    'accepts an explicit %s with all-four-season items',
    (season) => {
      expect(
        run(basics, { filters: { season, formality: 'Any' } }).candidates,
      ).toHaveLength(1);
    },
  );
  it('accepts adjacent formality and explains the styling mix', () => {
    const wardrobe = basics.map((garment) =>
      garment.group === 'Tops'
        ? { ...garment, formality: 'Smart-casual' as const }
        : garment,
    );
    const result = run(wardrobe, {
      filters: { season: 'Any', formality: 'Casual' },
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].reasons[0].code).toBe('adjacent-formality');
  });
  it.each(['Any', 'Smart-casual'] as const)(
    'rejects Casual/Formal mixing with a %s formality filter',
    (formality) => {
      const wardrobe = [
        item('top', 'Tops', { formality: 'Formal' }),
        item('bottom', 'Bottoms', { formality: 'Smart-casual' }),
        item('shoes', 'Shoes'),
      ];
      const result = run(wardrobe, { filters: { season: 'Any', formality } });
      expect(result.outcome).toBe('no-compatible-outfits');
      expect(result.diagnostics.filteredMissingGroups).toEqual([]);
    },
  );
  it('does not relax a Formal filter to admit Casual shoes', () => {
    expect(
      run(basics, { filters: { season: 'Any', formality: 'Formal' } })
        .diagnostics.filteredMissingGroups,
    ).toEqual(['Tops', 'Bottoms', 'Shoes']);
  });
});

describe('optional seasonal jackets', () => {
  const jacket = item('jacket', 'Outerwear', { color: 'navy' });
  it.each(['Autumn', 'Winter'] as const)(
    'adds an owned compatible jacket in %s',
    (season) => {
      const candidate = run([...basics, jacket], {
        filters: { season, formality: 'Any' },
      }).candidates[0];
      expect(candidate.slots.jacket).toBe('jacket');
      expect(candidate.jacketHint).toBeUndefined();
      expect(candidate.id).toBe(
        outfitIdentity([...basics, jacket].map((garment) => garment.id)),
      );
    },
  );
  it.each(['Any', 'Spring', 'Summer'] as const)(
    'keeps %s results jacket-free',
    (season) => {
      const candidate = run([...basics, jacket], {
        filters: { season, formality: 'Any' },
      }).candidates[0];
      expect(candidate.slots.jacket).toBeUndefined();
      expect(candidate.jacketHint).toBeUndefined();
    },
  );
  it('keeps the base outfit and offers an optional hint when no compatible jacket exists', () => {
    const wardrobe = [...basics, { ...jacket, formality: 'Formal' as const }];
    const candidate = run(wardrobe, {
      filters: { season: 'Winter', formality: 'Any' },
    }).candidates[0];
    expect(candidate.slots.jacket).toBeUndefined();
    expect(candidate.jacketHint).toContain('could add');
  });
  it('checks jacket season, availability and patterns during selection', () => {
    const wardrobe = [
      ...basics.map((garment) =>
        garment.group === 'Tops'
          ? { ...garment, pattern: 'Striped' as const }
          : garment,
      ),
      item('a-patterned', 'Outerwear', { color: 'navy', pattern: 'Printed' }),
      item('z-solid', 'Outerwear', { color: 'navy' }),
      item('a-removed', 'Outerwear', { available: false }),
      item('a-summer', 'Outerwear', { seasons: ['Summer'] }),
    ];
    expect(
      run(wardrobe, { filters: { season: 'Winter', formality: 'Any' } })
        .candidates[0].slots.jacket,
    ).toBe('z-solid');
  });
  it('does not claim a missing jacket after an interrupted search', () => {
    const result = run([...basics, jacket], {
      filters: { season: 'Winter', formality: 'Any' },
      limits: { maxEvaluations: 1 },
    });
    expect(result.outcome).toBe('search-limited');
    expect(result.candidates).toEqual([]);
    expect(result.diagnostics).toMatchObject({
      evaluations: 1,
      searchExhaustive: false,
      incompleteJacketSearches: 1,
    });
    expect(
      run([...basics, jacket], {
        filters: { season: 'Winter', formality: 'Any' },
        limits: { maxEvaluations: 2 },
      }).diagnostics.searchExhaustive,
    ).toBe(true);
  });
});

describe('preferences, bounds and paging', () => {
  const wardrobe = [
    ...basics,
    item('b-top', 'Tops', { color: 'burgundy' }),
    item('c-top', 'Tops', { color: 'olive' }),
  ];
  const favorite = outfitIdentity(['c-top', 'bottom', 'shoes']);
  const disliked = outfitIdentity(['top', 'bottom', 'shoes']);
  const preferences = {
    [favorite]: 'favorite' as const,
    [disliked]: 'disliked' as const,
  };
  it('groups eligible favorites first and revealed dislikes last', () => {
    const result = run(wardrobe, { preferences });
    expect(result.candidates.map((candidate) => candidate.preference)).toEqual([
      'favorite',
      'neutral',
    ]);
    const revealed = run(wardrobe, { preferences, showDisliked: true });
    expect(
      revealed.candidates.map((candidate) => candidate.preference),
    ).toEqual(['favorite', 'neutral', 'disliked']);
  });
  it('neutral clearing restores ordinary eligibility', () => {
    expect(
      run(wardrobe, { preferences: { [disliked]: 'neutral' } }).candidates,
    ).toHaveLength(3);
  });
  it('preserves eligible favorite identities outside a capped generated pool', () => {
    const result = run(wardrobe, {
      preferences,
      limits: { maxCandidates: 1, maxEvaluations: 1 },
    });
    expect(ids(result)).toContain(favorite);
    expect(result.candidates[0].preference).toBe('favorite');
    expect(result.diagnostics.favoriteEvaluations).toBe(1);
    expect(result.diagnostics.searchExhaustive).toBe(false);
  });
  it('ignores stale, malformed and season-ineligible favorite references', () => {
    const result = run(wardrobe, {
      preferences: {
        broken: 'favorite',
        '["missing"]': 'favorite',
        [favorite]: 'favorite',
      },
      filters: { season: 'Winter', formality: 'Any' },
    });
    expect(result.candidates.map((candidate) => candidate.preference)).toEqual([
      'favorite',
      'neutral',
      'neutral',
    ]);
    const seasonal = wardrobe.map((garment) =>
      garment.id === 'c-top'
        ? { ...garment, seasons: ['Summer'] as const }
        : garment,
    );
    expect(
      ids(
        run(seasonal, {
          preferences,
          filters: { season: 'Winter', formality: 'Any' },
        }),
      ),
    ).not.toContain(favorite);
  });
  it('validates exact favorite jacket combinations and season policy', () => {
    const jackets = [
      item('a-jacket', 'Outerwear'),
      item('z-jacket', 'Outerwear'),
    ];
    const withJacket = outfitIdentity(['top', 'bottom', 'shoes', 'z-jacket']);
    const prefs = { [withJacket]: 'favorite' as const };
    expect(
      ids(run([...basics, ...jackets], { preferences: prefs })),
    ).not.toContain(withJacket);
    const winter = run([...basics, ...jackets], {
      preferences: prefs,
      filters: { season: 'Winter', formality: 'Any' },
    });
    expect(winter.candidates[0].id).toBe(withJacket);
    expect(new Set(ids(winter)).size).toBe(winter.candidates.length);
  });
  it('does not retain a jacket-free winter favorite when a compatible jacket is owned', () => {
    const baseId = outfitIdentity(basics.map((garment) => garment.id));
    const result = run([...basics, item('jacket', 'Outerwear')], {
      preferences: { [baseId]: 'favorite' },
      filters: { season: 'Winter', formality: 'Any' },
    });
    expect(ids(result)).not.toContain(baseId);
  });
  it('hidden dislikes do not occupy the retained result pool', () => {
    const result = run(wardrobe, {
      preferences: { [disliked]: 'disliked' },
      limits: { maxCandidates: 1 },
    });
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].id).not.toBe(disliked);
  });
  it('distinguishes hidden disliked results from incompatibility', () => {
    const result = run(basics, { preferences: { [disliked]: 'disliked' } });
    expect(result.outcome).toBe('hidden-disliked');
    expect(result.diagnostics.hiddenDisliked).toBe(1);
    expect(
      run(basics, {
        preferences: { [disliked]: 'disliked' },
        showDisliked: true,
      }).candidates,
    ).toHaveLength(1);
  });
  it('streams the exhaustive Cartesian product for small wardrobes', () => {
    const tops = [item('t0', 'Tops'), item('t1', 'Tops'), item('t2', 'Tops')];
    const bottoms = [item('b0', 'Bottoms'), item('b1', 'Bottoms')];
    const shoes = [item('s0', 'Shoes'), item('s1', 'Shoes')];
    const expected = tops.flatMap((top) =>
      bottoms.flatMap((bottom) =>
        shoes.map((shoe) => outfitIdentity([top.id, bottom.id, shoe.id])),
      ),
    );
    const result = run([...tops, ...bottoms, ...shoes]);
    expect([...ids(result)].sort()).toEqual(expected.sort());
    expect(result.diagnostics).toMatchObject({
      evaluations: 12,
      searchExhaustive: true,
      poolTruncated: false,
    });
    expect(
      run([...tops, ...bottoms, ...shoes], { limits: { maxEvaluations: 12 } })
        .diagnostics.searchExhaustive,
    ).toBe(true);
    expect(
      run([...tops, ...bottoms, ...shoes], { limits: { maxEvaluations: 11 } })
        .diagnostics.searchExhaustive,
    ).toBe(false);
    const first = getOutfitPage(result.candidates);
    const second = getOutfitPage(result.candidates, first.nextOffset);
    expect(first.candidates).toHaveLength(6);
    expect(first.hasMore).toBe(true);
    expect(second.candidates).toHaveLength(6);
    expect(second.hasMore).toBe(false);
    expect([...first.candidates, ...second.candidates]).toEqual(
      result.candidates,
    );
    expect(
      getOutfitPage(result.candidates, second.nextOffset).candidates,
    ).toEqual([]);
  });
  it('bounds retained candidates and traverses multiple tops and bottoms before stopping', () => {
    const wardrobe = [
      ...Array.from({ length: 20 }, (_, index) => item(`t${index}`, 'Tops')),
      ...Array.from({ length: 20 }, (_, index) => item(`b${index}`, 'Bottoms')),
      ...Array.from({ length: 20 }, (_, index) => item(`s${index}`, 'Shoes')),
    ];
    const result = run(wardrobe, {
      limits: { maxEvaluations: 100, maxCandidates: 12 },
    });
    expect(result.diagnostics).toMatchObject({
      evaluations: 100,
      retained: 12,
      searchExhaustive: false,
      poolTruncated: true,
    });
    expect(
      new Set(result.candidates.map((candidate) => candidate.slots.top)).size,
    ).toBeGreaterThan(1);
    expect(
      new Set(result.candidates.map((candidate) => candidate.slots.bottom))
        .size,
    ).toBeGreaterThan(1);
    expect(
      run([...wardrobe].reverse(), {
        limits: { maxEvaluations: 100, maxCandidates: 12 },
      }),
    ).toEqual(result);
  });
  it('enforces default work and retention limits for a realistic large wardrobe', () => {
    const wardrobe = (['Tops', 'Bottoms', 'Shoes'] as const).flatMap((group) =>
      Array.from({ length: 40 }, (_, index) =>
        item(`${group}-${index}`, group),
      ),
    );
    const result = run(wardrobe);
    expect(result.diagnostics).toMatchObject({
      evaluations: 50_000,
      retained: 240,
      searchExhaustive: false,
      poolTruncated: true,
    });
    expect(new Set(ids(result)).size).toBe(240);
  });
  it('separates budget-limited emptiness from a proven absence of compatible outfits', () => {
    const sparse = [
      item('a-formal', 'Tops', { formality: 'Formal' }),
      item('z-casual', 'Tops'),
      ...basics.filter((garment) => garment.group !== 'Tops'),
    ];
    expect(run(sparse, { limits: { maxEvaluations: 1 } }).outcome).toBe(
      'search-limited',
    );
    expect(run(sparse).candidates).toHaveLength(1);
    expect(getOutfitPage(run(sparse).candidates).hasMore).toBe(false);
  });
  it('rejects invalid paging offsets', () => {
    expect(() => getOutfitPage([], -1)).toThrow(RangeError);
    expect(() => getOutfitPage([], 0.5)).toThrow(RangeError);
  });
});

describe('input validation', () => {
  const valid: OutfitRequest = {
    items: basics,
    now,
    filters: { season: 'Any', formality: 'Any' },
  };
  it.each([
    null,
    { ...valid, items: null },
    { ...valid, items: [null] },
    { ...valid, items: [...basics, basics[0]] },
    { ...valid, items: [item('', 'Tops')] },
    { ...valid, items: [{ ...basics[0], color: 'unknown' }] },
    { ...valid, items: [{ ...basics[0], color: '__proto__' }] },
    { ...valid, items: [{ ...basics[0], group: 'Unknown' }] },
    { ...valid, items: [{ ...basics[0], seasons: [] }] },
    { ...valid, items: [{ ...basics[0], seasons: ['Winter', 'Winter'] }] },
    { ...valid, items: [{ ...basics[0], pattern: 'Unknown' }] },
    { ...valid, items: [{ ...basics[0], available: 'yes' }] },
    { ...valid, filters: { season: 'Monsoon', formality: 'Any' } },
    { ...valid, filters: null },
    { ...valid, now: NaN },
    { ...valid, now: Infinity },
    { ...valid, now: -1 },
    { ...valid, history: { items: { top: 'yesterday' } } },
    { ...valid, history: { outfits: { stale: NaN } } },
    { ...valid, preferences: { outfit: 'five-stars' } },
    { ...valid, limits: { maxEvaluations: 0 } },
    { ...valid, limits: { maxCandidates: 241 } },
    { ...valid, limits: { maxCandidates: 1.5 } },
    { ...valid, showDisliked: 'yes' },
  ])('returns a structured error for malformed input %#', (request) => {
    const result = generateOutfits(request as OutfitRequest);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('invalid-input');
      expect(result.error.fields.length).toBeGreaterThan(0);
    }
  });
});
