import type { ColorId, Formality } from '@/features/onboarding/catalog';
import type {
  OutfitFilters,
  OutfitItem,
  OutfitReason,
  WearHistory,
} from './types';

export const engineDefaults = {
  maxEvaluations: 50_000,
  maxCandidates: 240,
  freshnessDays: 7,
  freshnessPoints: 3,
  diversityWindow: 3,
} as const;

export const colorRules = {
  white: { family: 'neutral', neutral: true },
  'off-white': { family: 'earth', neutral: true },
  black: { family: 'neutral', neutral: true },
  navy: { family: 'blue', neutral: true },
  grey: { family: 'neutral', neutral: true },
  'dark-grey': { family: 'neutral', neutral: true },
  olive: { family: 'earth', neutral: false },
  beige: { family: 'earth', neutral: true },
  burgundy: { family: 'red', neutral: false },
  'light-blue': { family: 'blue', neutral: false },
  pink: { family: 'red', neutral: false },
  oatmeal: { family: 'earth', neutral: true },
  brown: { family: 'earth', neutral: true },
  indigo: { family: 'blue', neutral: false },
  khaki: { family: 'earth', neutral: true },
} satisfies Record<ColorId, { family: string; neutral: boolean }>;

export const formalityLevels: Record<Formality, number> = {
  Casual: 0,
  'Smart-casual': 1,
  Formal: 2,
};

export function eligibleItem(
  item: OutfitItem,
  filters: OutfitFilters,
): boolean {
  return (
    item.available &&
    (filters.season === 'Any' || item.seasons.includes(filters.season)) &&
    (filters.formality === 'Any' ||
      Math.abs(
        formalityLevels[item.formality] - formalityLevels[filters.formality],
      ) <= 1)
  );
}

export function compatibleFormalities(items: readonly OutfitItem[]): boolean {
  const levels = items.map((item) => formalityLevels[item.formality]);
  return Math.max(...levels) - Math.min(...levels) <= 1;
}

export function needsJacket(filters: OutfitFilters): boolean {
  return filters.season === 'Autumn' || filters.season === 'Winter';
}

export function styleCompatibility(
  items: readonly OutfitItem[],
  filters: OutfitFilters,
): { score: number; reasons: OutfitReason[] } {
  const itemIds = items.map((item) => item.id);
  const accents = items.filter((item) => !colorRules[item.color].neutral);
  const families = new Set(
    accents.map((item) => colorRules[item.color].family),
  );
  let colorScore = 22;
  let colorReason: OutfitReason = {
    code: 'mixed-colors',
    text: 'Distinct accent color families make a bolder combination.',
    itemIds,
  };
  if (accents.length === 0) {
    colorScore = 40;
    colorReason = {
      code: 'neutral-colors',
      text: 'Neutral colors coordinate across these pieces.',
      itemIds,
    };
  } else if (families.size === 1) {
    colorScore = accents.length < items.length ? 38 : 36;
    colorReason = {
      code: 'coordinated-colors',
      text:
        accents.length < items.length
          ? 'Neutral pieces balance accents from one color family.'
          : 'Related accent colors keep the palette coordinated.',
      itemIds,
    };
  }

  const levels = items.map((item) => formalityLevels[item.formality]);
  const spread = Math.max(...levels) - Math.min(...levels);
  const exact = items.filter(
    (item) => item.formality === filters.formality,
  ).length;
  const formalityScore =
    filters.formality === 'Any'
      ? 40 - spread * 8
      : 30 + (10 * exact) / items.length - spread * 4;
  const formalityReason: OutfitReason = {
    code:
      spread || (filters.formality !== 'Any' && exact !== items.length)
        ? 'adjacent-formality'
        : 'exact-formality',
    text: spread
      ? 'Adjacent formality levels give this outfit a relaxed styling mix.'
      : filters.formality !== 'Any' && exact !== items.length
        ? 'These pieces share a formality adjacent to your requested level.'
        : filters.formality === 'Any'
          ? 'These pieces share the same formality.'
          : `Every piece matches your ${filters.formality.toLowerCase()} filter.`,
    itemIds,
  };
  const patterned = items.filter((item) => item.pattern !== 'Solid');
  const patternScore = Math.max(0, 20 - Math.max(0, patterned.length - 1) * 8);
  const patternReason: OutfitReason = {
    code: patterned.length > 1 ? 'multiple-patterns' : 'pattern-balance',
    text:
      patterned.length > 1
        ? 'Multiple patterned pieces make this a bolder pattern mix.'
        : 'At most one patterned piece keeps the pattern mix simple.',
    itemIds,
  };
  return {
    score: colorScore + formalityScore + patternScore,
    reasons: [formalityReason, colorReason, patternReason],
  };
}

export function freshnessAdjustment(
  items: readonly OutfitItem[],
  identity: string,
  history: WearHistory | undefined,
  now: number,
): number {
  const timestamps: number[] = [];
  for (const item of items) {
    if (history?.items && Object.hasOwn(history.items, item.id)) {
      timestamps.push(history.items[item.id]);
    }
  }
  if (history?.outfits && Object.hasOwn(history.outfits, identity)) {
    timestamps.push(history.outfits[identity]);
  }
  if (!timestamps.length) return 0;
  const window = engineDefaults.freshnessDays * 86_400_000;
  return (
    (timestamps.reduce(
      (total, timestamp) =>
        total + Math.min(1, Math.max(0, now - timestamp) / window),
      0,
    ) /
      timestamps.length) *
    engineDefaults.freshnessPoints
  );
}
