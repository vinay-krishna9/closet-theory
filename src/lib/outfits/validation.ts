import type { Group, Pattern, Season } from '@/features/onboarding/catalog';
import { colorRules, engineDefaults, formalityLevels } from './rules';

const groups: Record<Group, true> = {
  Tops: true,
  Bottoms: true,
  Shoes: true,
  Outerwear: true,
};
const seasons: Record<Season, true> = {
  Spring: true,
  Summer: true,
  Autumn: true,
  Winter: true,
};
const patterns: Record<Pattern, true> = {
  Solid: true,
  Striped: true,
  Checked: true,
  Printed: true,
};
const preferences = ['favorite', 'neutral', 'disliked'];

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function member(values: object, value: unknown): boolean {
  return typeof value === 'string' && Object.hasOwn(values, value);
}

function timestamp(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 8.64e15
  );
}

export function validateRequest(value: unknown): string[] {
  if (!record(value)) return ['request'];
  const errors: string[] = [];
  if (!timestamp(value.now)) errors.push('now');
  if (!record(value.filters)) errors.push('filters');
  else {
    if (
      value.filters.season !== 'Any' &&
      !member(seasons, value.filters.season)
    )
      errors.push('filters.season');
    if (
      value.filters.formality !== 'Any' &&
      !member(formalityLevels, value.filters.formality)
    )
      errors.push('filters.formality');
  }
  if (!Array.isArray(value.items)) errors.push('items');
  else {
    const ids = new Set<string>();
    value.items.forEach((item: unknown, index: number) => {
      const field = `items[${index}]`;
      if (!record(item)) {
        errors.push(field);
        return;
      }
      if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id))
        errors.push(`${field}.id`);
      else ids.add(item.id);
      if (!member(groups, item.group)) errors.push(`${field}.group`);
      if (!member(colorRules, item.color)) errors.push(`${field}.color`);
      if (!member(formalityLevels, item.formality))
        errors.push(`${field}.formality`);
      if (!member(patterns, item.pattern)) errors.push(`${field}.pattern`);
      if (typeof item.available !== 'boolean')
        errors.push(`${field}.available`);
      if (
        !Array.isArray(item.seasons) ||
        !item.seasons.length ||
        item.seasons.some((season: unknown) => !member(seasons, season)) ||
        new Set(item.seasons).size !== item.seasons.length
      )
        errors.push(`${field}.seasons`);
    });
  }
  if (
    value.showDisliked !== undefined &&
    typeof value.showDisliked !== 'boolean'
  )
    errors.push('showDisliked');
  if (value.preferences !== undefined) {
    if (
      !record(value.preferences) ||
      Object.values(value.preferences).some(
        (preference) =>
          typeof preference !== 'string' || !preferences.includes(preference),
      )
    )
      errors.push('preferences');
  }
  if (value.history !== undefined) {
    if (!record(value.history)) errors.push('history');
    else
      for (const key of ['items', 'outfits']) {
        const entries = value.history[key];
        if (
          entries !== undefined &&
          (!record(entries) ||
            Object.values(entries).some((time) => !timestamp(time)))
        )
          errors.push(`history.${key}`);
      }
  }
  if (value.limits !== undefined) {
    if (!record(value.limits)) errors.push('limits');
    else
      for (const key of ['maxEvaluations', 'maxCandidates'] as const) {
        const limit = value.limits[key];
        if (
          limit !== undefined &&
          (typeof limit !== 'number' ||
            !Number.isSafeInteger(limit) ||
            limit < 1 ||
            limit > engineDefaults[key])
        )
          errors.push(`limits.${key}`);
      }
  }
  return errors;
}
