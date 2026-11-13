import { describe, expect, it } from 'vitest';
import { catalog, colors, seasons } from '@/features/onboarding/catalog';
import {
  changeType,
  configurationKey,
  defaultGarment,
  sameConfiguration,
  similarItems,
  validateGarment,
  wardrobeReducer,
  type Garment,
} from './model';

describe('catalog configuration', () => {
  it('preserves a custom display name when changing garment type', () => {
    const changed = changeType(
      { ...defaultGarment('tshirt'), name: 'My travel essential' },
      'sneakers',
    );
    expect(changed.name).toBe('My travel essential');
    expect(changed.neckline).toBeUndefined();
    expect(validateGarment(changed)).toEqual([]);
  });
  it('provides eight valid types and 64 named color variants without importing review fixtures', () => {
    expect(catalog).toHaveLength(8);
    expect(catalog.reduce((n, type) => n + type.colors.length, 0)).toBe(64);
    for (const type of catalog) {
      expect(validateGarment(defaultGarment(type.id))).toEqual([]);
      expect(new Set(type.colors).size).toBe(type.colors.length);
      for (const color of type.colors) expect(colors[color].name).toBeTruthy();
    }
    expect(
      catalog.filter((type) => type.group === 'Tops').map((type) => type.id),
    ).toEqual(['tshirt', 'shirt', 'sweater']);
    expect(
      catalog.filter((type) => type.group === 'Bottoms').map((type) => type.id),
    ).toEqual(['jeans', 'chinos', 'shorts']);
  });
  it('clears irrelevant clothing details and retains compatible common tags when type changes', () => {
    const top = {
      ...defaultGarment('tshirt'),
      color: 'navy' as const,
      pattern: 'Striped' as const,
      formality: 'Formal' as const,
      seasons: ['Winter'] as const,
    };
    const shoe = changeType({ ...top, seasons: [...top.seasons] }, 'sneakers');
    expect(shoe).toMatchObject({
      typeId: 'sneakers',
      color: 'navy',
      pattern: 'Solid',
      formality: 'Formal',
      seasons: ['Winter'],
      neckline: undefined,
      sleeves: undefined,
    });
    expect(validateGarment(shoe)).toEqual([]);
  });
  it('rejects missing seasons, unknown color choices and inconsistent customizations', () => {
    expect(
      validateGarment({ ...defaultGarment('tshirt'), seasons: [] }),
    ).toContain('Choose at least one valid season.');
    expect(
      validateGarment({ ...defaultGarment('jeans'), color: 'pink' }),
    ).toContain('Choose a color available for this type.');
    expect(
      validateGarment({ ...defaultGarment('sneakers'), neckline: 'V-neck' }),
    ).toContain('Choose an applicable neckline.');
    expect(
      configurationKey({ ...defaultGarment('tshirt'), neckline: undefined }),
    ).toBeNull();
    expect(
      validateGarment({ ...defaultGarment('shirt'), name: '  ' }),
    ).not.toEqual([]);
  });
});

describe('wardrobe identity and duplicate behavior', () => {
  it('treats season order and display names as irrelevant to exact configuration, while styles remain distinct', () => {
    const item = defaultGarment('tshirt');
    expect(
      sameConfiguration(item, {
        ...item,
        name: 'My tee',
        seasons: [...seasons].reverse(),
      }),
    ).toBe(true);
    for (const patch of [
      { pattern: 'Striped' },
      { neckline: 'V-neck' },
      { sleeves: 'Long sleeves' },
      { formality: 'Formal' },
      { seasons: ['Winter'] },
    ])
      expect(sameConfiguration(item, { ...item, ...patch } as Garment)).toBe(
        false,
      );
    expect(
      sameConfiguration(
        { ...item, neckline: undefined },
        { ...item, neckline: undefined },
      ),
    ).toBe(false);
  });
  it('starts empty and guards duplicate IDs, rapid repeated adds and retries', () => {
    const one = { ...defaultGarment('tshirt'), id: 'one' };
    const first = wardrobeReducer([], { type: 'add', item: one });
    expect(first).toHaveLength(1);
    expect(
      wardrobeReducer(first, { type: 'add', item: { ...one, id: 'retry' } }),
    ).toBe(first);
    expect(
      wardrobeReducer(first, {
        type: 'add',
        item: one,
        intentionalDuplicate: true,
      }),
    ).toBe(first);
    expect(
      wardrobeReducer(first, {
        type: 'add',
        item: { ...one, id: 'two' },
        intentionalDuplicate: true,
      }),
    ).toHaveLength(2);
  });
  it('separates broader similarity from exact matches and preserves the replaced item identity', () => {
    const one = { ...defaultGarment('tshirt'), id: 'one' };
    const changed = { ...one, pattern: 'Striped' as const };
    expect(similarItems([one], changed)).toEqual([one]);
    expect(similarItems([one], changed, 'one')).toEqual([]);
    const updated = wardrobeReducer([one], {
      type: 'update',
      id: 'one',
      garment: changed,
    });
    expect(updated[0]).toMatchObject({ id: 'one', pattern: 'Striped' });
    expect(one.pattern).toBe('Solid');
  });
  it('keeps templates immutable and removes only the selected wardrobe entry', () => {
    const snapshot = JSON.stringify(catalog);
    const original = { ...defaultGarment('chinos'), id: 'one' };
    const items = wardrobeReducer([original], {
      type: 'add',
      item: { ...original, id: 'two' },
      intentionalDuplicate: true,
    });
    expect(wardrobeReducer(items, { type: 'remove', id: 'one' })).toEqual([
      { ...original, id: 'two' },
    ]);
    expect(JSON.stringify(catalog)).toBe(snapshot);
    expect(
      wardrobeReducer(items, {
        type: 'update',
        id: 'two',
        garment: { ...original, seasons: [] },
      }),
    ).toBe(items);
  });
});
