import {
  colors,
  formalities,
  getType,
  seasons,
  type ColorId,
  type Formality,
  type Neckline,
  type Pattern,
  type Season,
  type Sleeves,
  type TypeId,
} from '@/features/onboarding/catalog';

export type Garment = {
  typeId: TypeId;
  color: ColorId;
  name: string;
  formality: Formality;
  seasons: Season[];
  pattern: Pattern;
  neckline?: Neckline;
  sleeves?: Sleeves;
};
export type WardrobeItem = Garment & { id: string; revision?: number };
export function defaultGarment(typeId: TypeId): Garment {
  const type = getType(typeId);
  return {
    typeId,
    color: type.colors[0],
    name: `${colors[type.colors[0]].name} ${type.name}`,
    formality: type.formality,
    seasons: [...type.seasons],
    pattern: 'Solid',
    neckline: type.necklines[0],
    sleeves: type.sleeves[0],
  };
}
export function changeType(garment: Garment, typeId: TypeId): Garment {
  const type = getType(typeId),
    defaults = defaultGarment(typeId);
  const color = type.colors.includes(garment.color)
    ? garment.color
    : defaults.color;
  return {
    ...garment,
    typeId,
    color,
    name:
      garment.name ===
      `${colors[garment.color].name} ${getType(garment.typeId).name}`
        ? `${colors[color].name} ${type.name}`
        : garment.name,
    neckline:
      garment.neckline && type.necklines.includes(garment.neckline)
        ? garment.neckline
        : defaults.neckline,
    sleeves:
      garment.sleeves && type.sleeves.includes(garment.sleeves)
        ? garment.sleeves
        : defaults.sleeves,
    pattern: type.patterns.includes(garment.pattern)
      ? garment.pattern
      : 'Solid',
  };
}
export function validateGarment(item: Garment): string[] {
  const type = getType(item.typeId),
    errors: string[] = [];
  if (!item.name.trim() || item.name.trim().length > 80)
    errors.push('Use a garment name between 1 and 80 characters.');
  if (!type.colors.includes(item.color))
    errors.push('Choose a color available for this type.');
  if (!formalities.includes(item.formality)) errors.push('Choose a formality.');
  if (
    !item.seasons.length ||
    item.seasons.some((s) => !seasons.includes(s)) ||
    new Set(item.seasons).size !== item.seasons.length
  )
    errors.push('Choose at least one valid season.');
  if (!type.patterns.includes(item.pattern))
    errors.push('Choose a pattern available for this type.');
  if (
    type.necklines.length
      ? !item.neckline || !type.necklines.includes(item.neckline)
      : item.neckline !== undefined
  )
    errors.push('Choose an applicable neckline.');
  if (
    type.sleeves.length
      ? !item.sleeves || !type.sleeves.includes(item.sleeves)
      : item.sleeves !== undefined
  )
    errors.push('Choose applicable sleeves.');
  return errors;
}
// Names are display text; equality is the complete confirmed clothing configuration.
export function configurationKey(item: Garment): string | null {
  if (validateGarment(item).length) return null;
  return JSON.stringify([
    item.typeId,
    item.color,
    item.formality,
    seasons.filter((s) => item.seasons.includes(s)),
    item.pattern,
    item.neckline ?? null,
    item.sleeves ?? null,
  ]);
}
export function sameConfiguration(a: Garment, b: Garment) {
  const key = configurationKey(a);
  return key !== null && key === configurationKey(b);
}
export function similarItems(
  items: readonly WardrobeItem[],
  draft: Garment,
  excludeId?: string,
) {
  return items.filter(
    (item) =>
      item.id !== excludeId &&
      item.typeId === draft.typeId &&
      item.color === draft.color,
  );
}
export type WardrobeAction =
  | { type: 'add'; item: WardrobeItem; intentionalDuplicate?: boolean }
  | { type: 'update'; id: string; garment: Garment; expectedRevision?: number }
  | { type: 'remove'; id: string; expectedRevision?: number };
export function wardrobeReducer(
  items: readonly WardrobeItem[],
  action: WardrobeAction,
): readonly WardrobeItem[] {
  if (action.type === 'remove')
    return items.filter((item) => item.id !== action.id);
  const garment = action.type === 'add' ? action.item : action.garment;
  if (validateGarment(garment).length) return items;
  if (action.type === 'add') {
    if (items.some((item) => item.id === action.item.id)) return items;
    if (
      !action.intentionalDuplicate &&
      items.some((item) => sameConfiguration(item, action.item))
    )
      return items;
    return [
      ...items,
      {
        ...action.item,
        name: action.item.name.trim(),
        seasons: [...action.item.seasons],
      },
    ];
  }
  return items.map((item) =>
    item.id === action.id
      ? {
          ...action.garment,
          id: item.id,
          name: action.garment.name.trim(),
          seasons: [...action.garment.seasons],
        }
      : item,
  );
}
