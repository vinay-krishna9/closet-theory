import { describe, expect, it } from 'vitest';
import { colors } from '@/features/onboarding/catalog';
import { generateOutfits } from './engine';
import { outfitIdentity } from './identity';
import { rankCandidates } from './ranking';
import { colorRules, freshnessAdjustment, styleCompatibility } from './rules';
import type { OutfitItem, ScoredCandidate } from './types';

const now = Date.UTC(2026, 10, 17);
const day = 86_400_000;
const filters = { season: 'Any', formality: 'Any' } as const;
const garments: OutfitItem[] = [
  {
    id: 'top',
    group: 'Tops',
    color: 'white',
    formality: 'Casual',
    seasons: ['Summer'],
    pattern: 'Solid',
    available: true,
  },
  {
    id: 'bottom',
    group: 'Bottoms',
    color: 'indigo',
    formality: 'Casual',
    seasons: ['Summer'],
    pattern: 'Solid',
    available: true,
  },
  {
    id: 'shoes',
    group: 'Shoes',
    color: 'white',
    formality: 'Casual',
    seasons: ['Summer'],
    pattern: 'Solid',
    available: true,
  },
];

describe('compatibility and reasons', () => {
  it('defines color rules for the complete catalog palette', () => {
    expect(Object.keys(colorRules).sort()).toEqual(Object.keys(colors).sort());
  });
  it('ranks neutral coordination above multiple accent families', () => {
    const neutral = garments.map((garment, index) => ({
      ...garment,
      color: (['navy', 'beige', 'white'] as const)[index],
    }));
    const bold = garments.map((garment, index) => ({
      ...garment,
      color: (['burgundy', 'indigo', 'white'] as const)[index],
    }));
    expect(styleCompatibility(neutral, filters).score).toBeGreaterThan(
      styleCompatibility(garments, filters).score,
    );
    expect(styleCompatibility(garments, filters).score).toBeGreaterThan(
      styleCompatibility(bold, filters).score,
    );
    expect(styleCompatibility(neutral, filters).reasons[1].code).toBe(
      'neutral-colors',
    );
    expect(styleCompatibility(bold, filters).reasons[1].code).toBe(
      'mixed-colors',
    );
  });
  it('recognizes related accent families and accurately describes adjacent requested formality', () => {
    const related = garments.map((garment) => ({
      ...garment,
      color: 'light-blue' as const,
    }));
    expect(styleCompatibility(related, filters).reasons[1].text).toContain(
      'Related accent',
    );
    const result = styleCompatibility(garments, {
      season: 'Any',
      formality: 'Smart-casual',
    });
    expect(result.reasons[0]).toMatchObject({ code: 'adjacent-formality' });
    expect(result.reasons[0].text).toContain('adjacent');
  });
  it('prefers exact requested formality and penalizes extra patterns without excluding them', () => {
    const onePattern = garments.map((garment, index) => ({
      ...garment,
      pattern: index === 0 ? ('Striped' as const) : ('Solid' as const),
    }));
    const manyPatterns = garments.map((garment) => ({
      ...garment,
      pattern: 'Printed' as const,
    }));
    expect(styleCompatibility(onePattern, filters).score).toBeGreaterThan(
      styleCompatibility(manyPatterns, filters).score,
    );
    expect(styleCompatibility(manyPatterns, filters).reasons[2].code).toBe(
      'multiple-patterns',
    );
    const result = generateOutfits({ items: manyPatterns, filters, now });
    expect(result.ok && result.candidates.length).toBe(1);
    expect(
      result.ok &&
        result.candidates[0].reasons.some(
          (reason) => reason.code === 'multiple-patterns',
        ),
    ).toBe(true);
    const exact = styleCompatibility(garments, {
      season: 'Any',
      formality: 'Casual',
    }).score;
    const adjacent = styleCompatibility(garments, {
      season: 'Any',
      formality: 'Smart-casual',
    }).score;
    expect(exact).toBeGreaterThan(adjacent);
  });
});

describe('freshness', () => {
  const identity = outfitIdentity(garments.map((garment) => garment.id));
  it('has no effect without recorded history or for stale references', () => {
    expect(freshnessAdjustment(garments, identity, undefined, now)).toBe(0);
    expect(
      freshnessAdjustment(
        garments,
        identity,
        { items: { removed: 0 }, outfits: { stale: 0 } },
        now,
      ),
    ).toBe(0);
  });
  it('uses injected time, clamps future wears and saturates after seven days', () => {
    const history = { items: { top: now } };
    expect(freshnessAdjustment(garments, identity, history, now - day)).toBe(0);
    expect(
      freshnessAdjustment(garments, identity, history, now + 3.5 * day),
    ).toBe(1.5);
    expect(
      freshnessAdjustment(garments, identity, history, now + 7 * day),
    ).toBe(3);
    expect(
      freshnessAdjustment(garments, identity, history, now + 100 * day),
    ).toBe(3);
  });
  it('combines item and exact outfit recency and ignores inherited record values', () => {
    const history = {
      items: { top: now },
      outfits: { [identity]: now - 7 * day },
    };
    expect(freshnessAdjustment(garments, identity, history, now)).toBe(1.5);
    expect(
      freshnessAdjustment(
        garments,
        identity,
        { items: Object.create({ top: 0 }) },
        now,
      ),
    ).toBe(0);
  });
  it('moves an equally styled, older outfit forward without inventing visitor wear reasons', () => {
    const wardrobe = [...garments, { ...garments[0], id: 'z-older' }];
    const result = generateOutfits({
      items: wardrobe,
      filters,
      now,
      history: { items: { 'z-older': now - 7 * day } },
    });
    expect(result.ok && result.candidates[0].slots.top).toBe('z-older');
    expect(
      result.ok &&
        result.candidates[0].reasons.some(
          (reason) => reason.code === 'freshness',
        ),
    ).toBe(true);
    const visitor = generateOutfits({ items: wardrobe, filters, now });
    expect(
      visitor.ok &&
        visitor.candidates.every((candidate) =>
          candidate.reasons.every((reason) => reason.code !== 'freshness'),
        ),
    ).toBe(true);
  });
});

function scored(
  id: string,
  top: string,
  bottom: string,
  style: number,
  freshness = 0,
  preference: 'favorite' | 'neutral' | 'disliked' = 'neutral',
): ScoredCandidate {
  return {
    style,
    freshness,
    candidate: {
      id,
      slots: { top, bottom, shoes: 'shoes' },
      preference,
      reasons: [],
    },
  };
}

describe('style-first ranking and diversity', () => {
  it('keeps stronger style ahead when the gap exceeds the freshness and diversity allowances', () => {
    const strong = scored('strong', 't1', 'b1', 100);
    const weak = scored('weak', 't2', 'b2', 92, 3);
    expect(
      rankCandidates([weak, strong]).map((value) => value.candidate.id),
    ).toEqual(['strong', 'weak']);
  });
  it('uses stable IDs for exact ties and varies close-scoring tops then bottoms', () => {
    const candidates = [
      scored('a', 't1', 'b1', 100),
      scored('b', 't1', 'b2', 100),
      scored('c', 't2', 'b1', 98),
      scored('d', 't2', 'b2', 98),
      scored('e', 't3', 'b3', 90),
    ];
    const result = rankCandidates(candidates).map(
      (value) => value.candidate.id,
    );
    expect(result).toEqual(['a', 'd', 'b', 'c', 'e']);
    expect(
      rankCandidates([...candidates].reverse()).map(
        (value) => value.candidate.id,
      ),
    ).toEqual(result);
  });
  it('keeps diversity inside preference groups and allows repeats when needed', () => {
    const candidates = [
      scored('fav', 't1', 'b1', 60, 0, 'favorite'),
      scored('neutral', 't1', 'b1', 100),
      scored('disliked', 't2', 'b2', 100, 0, 'disliked'),
    ];
    expect(
      rankCandidates(candidates).map((value) => value.candidate.id),
    ).toEqual(['fav', 'neutral', 'disliked']);
  });
});
